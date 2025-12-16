import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Text, Box } from "@chakra-ui/react";
import { splitMarkdown } from "@/utils/splitMarkdown";
import { useTypewriter } from "@/hooks/useTypewriter";

type Props = {
    content: string;
};

/* ⭐ style กลางสำหรับ markdown table */
const markdownComponents = {
    table: ({ children }: any) => (
        <Box overflowX="auto" my={4}>
            <table
                style={{
                    borderCollapse: "collapse",
                    width: "100%",
                }}
            >
                {children}
            </table>
        </Box>
    ),
    th: ({ children }: any) => (
        <th
            style={{
                border: "1px solid #CBD5E0",
                padding: "8px",
                background: "#F7FAFC",
                fontWeight: "bold",
                textAlign: "left",
            }}
        >
            {children}
        </th>
    ),
    td: ({ children }: any) => (
        <td
            style={{
                border: "1px solid #CBD5E0",
                padding: "8px",
            }}
        >
            {children}
        </td>
    ),
};

export default function AIMarkdownSequential({ content }: Props) {
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
                        onDone={isLastVisible ? showNext : undefined}
                    />
                );
            })}
        </>
    );
}

function TypingBlock({
    text,
    onDone,
}: {
    text: string;
    onDone?: () => void;
}) {
    const { displayed, done } = useTypewriter(text, 12);

    // ✅ พิมพ์เสร็จ → render markdown เต็มรูปแบบ
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

    // ⏳ ระหว่างพิมพ์ → text ธรรมดา
    return (
        <Text whiteSpace="pre-wrap">
            {displayed}
            ▍
        </Text>
    );
}
