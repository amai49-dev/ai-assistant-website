import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Box, Text } from '@chakra-ui/react'

type Props = {
    content: string
}

export default function MarkdownMessage({ content }: Props) {
    return (
        <Box className="markdown">
            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                    table: ({ children }) => (
                        <Box overflowX="auto" my={3}>
                            <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                                {children}
                            </table>
                        </Box>
                    ),
                    th: ({ children }) => (
                        <th style={{ border: '1px solid #ddd', padding: 8, fontWeight: 'bold', background: '#f7f7f7' }}>
                            {children}
                        </th>
                    ),
                    td: ({ children }) => (
                        <td style={{ border: '1px solid #ddd', padding: 8 }}>
                            {children}
                        </td>
                    ),
                    p: ({ children }) => (
                        <Text mb={2}>{children}</Text>
                    ),
                }}
            >
                {content}
            </ReactMarkdown>
        </Box>
    )
}
