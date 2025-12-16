// components/Navbar.tsx
import { useState, useEffect } from "react";
import { Flex, Text, Spacer, Avatar, IconButton } from "@chakra-ui/react";
import { useRouter } from "next/router";
import { FiLogOut } from "react-icons/fi";

const Navbar = () => {
  const router = useRouter();
  const path = router.pathname;
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    // Check for token on client-side only
    const storedToken = localStorage.getItem("token");
    setToken(storedToken);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    // Also clear the HTTP-only cookie by calling logout API
    fetch("/api/logout", { method: "POST" });
    setToken(null);
    router.push("/login");
  };

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
      <Flex align="center" gap={3}>
        <Avatar name="Piriwit" size="sm" />
        {token && (
          <IconButton
            aria-label="Logout"
            icon={<FiLogOut />}
            onClick={handleLogout}
            variant="ghost"
            colorScheme="red"
            size="sm"
          />
        )}
      </Flex>
    </Flex>
  );
};

export default Navbar;
