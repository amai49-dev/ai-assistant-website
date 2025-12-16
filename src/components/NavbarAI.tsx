// components/Navbar.tsx
import {
  Box,
  Flex,
  Text,
  Spacer,
  Avatar,
  Grid,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  Button,
} from "@chakra-ui/react";
import { useRouter } from "next/router";
import { HamburgerIcon } from "@chakra-ui/icons";
import { useEffect, useState } from "react";
import { FiLogOut } from "react-icons/fi";

const NavbarAI = () => {
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
    <Flex align="center" boxShadow="md">
      <Box
        mt={4}
        px={4}
        position="absolute"
        top={1}
        right={4}
        zIndex={1}
      >
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
      </Box>
    </Flex>
  );
};

export default NavbarAI;
