// components/Navbar.tsx
import { Box, Flex, Text, Spacer, Avatar } from "@chakra-ui/react";

const Navbar = () => {
  return (
    <Flex px={4} py={2} align="center" bg="white" boxShadow="md">
      <Flex align="center" direction="column">
        <Text fontSize="xl" fontWeight="bold">Aplication AI</Text>
        <Text fontSize="xs" fontWeight="light">AI Assistant</Text>
      </Flex>
      <Spacer />
      <Avatar name="Admin" size="sm" />
    </Flex>
  );
};

export default Navbar;
