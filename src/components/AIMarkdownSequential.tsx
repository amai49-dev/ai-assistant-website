import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Text } from "@chakra-ui/react";
import { splitMarkdown } from "@/utils/splitMarkdown";
import { useTypewriter } from "@/hooks/useTypewriter";
import { markdownComponents } from "@/utils/markdownComponents";

type Props = {
  content: string;
  onFinished?: () => void;
};

export default function AIMarkdownSequential({ content, onFinished }: Props) {
  const blocks = splitMarkdown(content);
  const [visibleCount, setVisibleCount] = useState(1);

  useEffect(() => {
    setVisibleCount(1);
  }, [content]);

  const showNext = () => {
    setVisibleCount((c) => Math.min(c + 1, blocks.length));
  };

  return (
    <>
      {blocks.slice(0, visibleCount).map((block, index) => {
        const isLastVisible = index === visibleCount - 1;

        if (block.type === "table") {
          // ตาราง → render ทีเดียว + ไป block ถัดไป
          if (isLastVisible) {
            setTimeout(showNext, 0);
          }

          return (
            <ReactMarkdown
              key={`table-${index}-${content}`}
              remarkPlugins={[remarkGfm]}
              components={markdownComponents}
            >
              {block.content}
            </ReactMarkdown>
          );
        }

        return (
          <TypingBlock
            key={`${index}-${content}`}
            text={block.content}
            onDone={() => {
              showNext();
              // เมื่อ block สุดท้ายเสร็จ → แจ้ง parent
              if (index === blocks.length - 1) {
                onFinished?.();
              }
            }}
          />
        );
      })}
    </>
  );
}

function TypingBlock({
  text,
  onDone,
  scrollToBottom,
}: {
  text: string;
  onDone?: () => void;
  scrollToBottom?: () => void;
}) {
  const { displayed, done } = useTypewriter(text, 12);
  useEffect(() => {
    scrollToBottom?.();
  }, [displayed]);

  // พิมพ์เสร็จ → render markdown เต็มรูปแบบ
  if (done) {
    if (onDone) onDone();

    return (
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {text}
      </ReactMarkdown>
    );
  }

  // ระหว่างพิมพ์ → text ธรรมดา
  return (
    <Text whiteSpace="pre-wrap">
      {displayed}
      ▍
    </Text>
  );
}
