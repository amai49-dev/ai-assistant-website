// components/Sidebar.tsx
import { Box, VStack, Link as ChakraLink } from "@chakra-ui/react";
import NextLink from "next/link";

const Sidebar = () => {
  const links = [
    { href: "/ai-assistant", label: "Meeting Management" },
    { href: "/", label: "กลับสู่หน้าแรก" },
  ];

  return (
    <Box
      w={{ base: "full", md: "250px" }}
      bg="gray.100"
      p={6}
      minH="calc(100vh - 64px)"
    >
      <VStack align="stretch" spacing={4}>
        {links.map((link, i) => (
          <ChakraLink
            key={i}
            as={NextLink}
            href={link.href}
            display="block"
            w="full"
            px={3}
            py={2}
            borderRadius="md"
            textAlign="center"
            transition="all 0.3s ease"
            _hover={{
              bgGradient: "linear(to-r, blue.600, purple.600)",
              color: "white",
              boxShadow: "0 4px 12px rgba(59,130,246,0.3)",
            }}
          >
            {link.label}
          </ChakraLink>
        ))}
      </VStack>
    </Box>
  );
};

export default Sidebar;
