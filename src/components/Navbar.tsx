// components/Navbar.tsx
import { Box, Flex, Text, Spacer, Avatar } from "@chakra-ui/react";
import { useRouter } from "next/router";

const Navbar = () => {
  const router = useRouter();
  const path = router.pathname;

  // แปลง path → display name
  const pageMap: Record<string, string> = {
    "/": "Home",
    "/ai-chat": "AI Chat",
    "/schedule-meeting": "Schedule Meeting",
    "/meeting-management": "Meeting Management",
  };

  const pageName =
    pageMap[path] ||
    path.replace("/", "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <Flex px={4} py={2} align="center" bg="white" boxShadow="md">
      <Flex align="center" direction="column">
        <Text fontSize="xl" fontWeight="bold">Aplication AI</Text>
        <Text fontSize="xs" fontWeight="light">{pageName}</Text>
      </Flex>
      <Spacer />
      <Avatar name="Admin" size="sm" />
    </Flex>
  );
};

export default Navbar;
