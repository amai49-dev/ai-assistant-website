import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Box } from "@chakra-ui/react";
import { markdownComponents } from "@/utils/markdownComponents";

type Props = {
  content: string;
};

export default function MarkdownMessage({ content }: Props) {
  return (
    <Box>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
}
