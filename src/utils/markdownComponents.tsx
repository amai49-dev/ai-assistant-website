import { Box, Text, Heading, Link, Code, Divider, ListItem, OrderedList, UnorderedList } from "@chakra-ui/react";

// ------------------- Shared Markdown Components -------------------
// ใช้ร่วมกันระหว่าง MarkdownMessage และ AIMarkdownSequential
// เพื่อให้ AI response แสดงผลเหมือนกันทุกที่

export const markdownComponents: Record<string, React.FC<any>> = {
  // ------------------- Headings -------------------
  h1: ({ children }) => (
    <Heading as="h1" size="xl" mt={5} mb={3} lineHeight="1.3">
      {children}
    </Heading>
  ),
  h2: ({ children }) => (
    <Heading as="h2" size="lg" mt={4} mb={2} lineHeight="1.3">
      {children}
    </Heading>
  ),
  h3: ({ children }) => (
    <Heading as="h3" size="md" mt={3} mb={2} lineHeight="1.3">
      {children}
    </Heading>
  ),
  h4: ({ children }) => (
    <Heading as="h4" size="sm" mt={3} mb={1} lineHeight="1.4">
      {children}
    </Heading>
  ),
  h5: ({ children }) => (
    <Heading as="h5" size="xs" mt={2} mb={1} lineHeight="1.4">
      {children}
    </Heading>
  ),
  h6: ({ children }) => (
    <Heading as="h6" size="xs" mt={2} mb={1} color="gray.600" lineHeight="1.4">
      {children}
    </Heading>
  ),

  // ------------------- Paragraph -------------------
  p: ({ children }) => (
    <Text mb={2} lineHeight="1.7">
      {children}
    </Text>
  ),

  // ------------------- Strong / Emphasis -------------------
  strong: ({ children }) => <strong style={{ fontWeight: "bold" }}>{children}</strong>,
  em: ({ children }) => <em style={{ fontStyle: "italic" }}>{children}</em>,

  // ------------------- Links -------------------
  a: ({ href, children }) => (
    <Link
      href={href}
      color="blue.500"
      textDecoration="underline"
      _hover={{ color: "blue.600" }}
      isExternal
    >
      {children}
    </Link>
  ),

  // ------------------- Code -------------------
  code: ({ className, children, ...props }) => {
    // react-markdown ใส่ className="language-xxx" ให้ code block
    const isBlock = typeof className === "string" && className.startsWith("language-");

    if (isBlock) {
      return (
        <Code
          as="pre"
          display="block"
          whiteSpace="pre"
          overflowX="auto"
          bg="gray.800"
          color="gray.100"
          p={4}
          my={3}
          borderRadius="md"
          fontSize="sm"
          lineHeight="1.6"
          {...props}
        >
          {children}
        </Code>
      );
    }

    // inline code
    return (
      <Code
        bg="gray.100"
        color="red.600"
        px={1.5}
        py={0.5}
        borderRadius="sm"
        fontSize="0.9em"
        {...props}
      >
        {children}
      </Code>
    );
  },

  // pre wrapper -- ให้ส่ง children ตรง ๆ เพราะ code component จัดการ style แล้ว
  pre: ({ children }) => <>{children}</>,

  // ------------------- Lists -------------------
  ul: ({ children }) => (
    <UnorderedList pl={4} mb={2} spacing={1}>
      {children}
    </UnorderedList>
  ),
  ol: ({ children }) => (
    <OrderedList pl={4} mb={2} spacing={1}>
      {children}
    </OrderedList>
  ),
  li: ({ children }) => (
    <ListItem lineHeight="1.7" sx={{ "& > p": { display: "inline" } }}>
      {children}
    </ListItem>
  ),

  // ------------------- Blockquote -------------------
  blockquote: ({ children }) => (
    <Box
      borderLeft="4px solid"
      borderColor="blue.400"
      bg="blue.50"
      pl={4}
      pr={3}
      py={2}
      my={3}
      borderRadius="0 md md 0"
      color="gray.700"
    >
      {children}
    </Box>
  ),

  // ------------------- Horizontal Rule -------------------
  hr: () => <Divider my={4} borderColor="gray.300" />,

  // ------------------- Table -------------------
  table: ({ children }) => (
    <Box overflowX="auto" my={4}>
      <table style={{ borderCollapse: "collapse", width: "100%" }}>
        {children}
      </table>
    </Box>
  ),
  thead: ({ children }) => <thead>{children}</thead>,
  tbody: ({ children }) => <tbody>{children}</tbody>,
  tr: ({ children }) => <tr>{children}</tr>,
  th: ({ children }) => (
    <th
      style={{
        border: "1px solid #CBD5E0",
        padding: "8px 12px",
        background: "#EDF2F7",
        fontWeight: "bold",
        textAlign: "left",
      }}
    >
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td
      style={{
        border: "1px solid #CBD5E0",
        padding: "8px 12px",
      }}
    >
      {children}
    </td>
  ),

  // ------------------- Image -------------------
  img: ({ src, alt }) => (
    <Box
      as="img"
      src={src}
      alt={alt}
      maxW="100%"
      borderRadius="md"
      my={3}
    />
  ),
};
