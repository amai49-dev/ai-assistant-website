// components/SidebarAI.tsx
import { Box, VStack, Text, Select, Button, Divider } from "@chakra-ui/react";

const SidebarAI = () => {
    // Mock AI models
    const aiModels = ["General AI", "HR Care", "Product Expert", "Market Expert"];

    // Mock chat history
    const chatHistory = [
        { id: 1, title: "Chat 1", snippet: "สอบถามเรื่องทั่วไป..." },
        { id: 2, title: "Chat 2", snippet: "จัดการพนักงาน..." },
        { id: 3, title: "Chat 3", snippet: "คำแนะนำผลิตภัณฑ์..." },
    ];

    return (
        <Box
            w={{ base: "full", md: "250px" }}
            bg="gray.100"
            p={6}
            minH="calc(100vh - 64px)"
        >
            <VStack align="stretch" spacing={6}>
                {/* AI Model Selection */}
                {/* <Box>
          <Text fontWeight="bold" mb={2}>AI Model</Text>
          <Select placeholder="เลือก AI" size="sm">
            {aiModels.map((model, i) => (
              <option key={i} value={model}>{model}</option>
            ))}
          </Select>
        </Box> */}

                {/* New Chat Button */}
                <Button bgGradient="linear(to-r, blue.800, purple.600)" transition="all 0.3s ease" _hover={{ bgGradient: "linear(to-r, blue.600, purple.400)" }} size="sm" w="full" textColor="white" onClick={() => window.location.href = "/ai-assistant"}>
                    New Chat
                </Button>

                <Divider />
                {/* Chat History */}
                <Box>
                    <Text fontWeight="bold" mb={2}>Chat History</Text>
                    <VStack align="stretch" spacing={2} maxH="200px" overflowY="auto">
                        {chatHistory.map(chat => (
                            <Box
                                key={chat.id}
                                p={2}
                                borderRadius="md"
                                bg="white"
                                boxShadow="sm"
                                transition="all 0.3s ease"
                                _hover={{
                                    bgGradient: "linear(to-r, blue.600, purple.400)",
                                    color: "white",
                                }}
                                cursor="pointer"
                            >
                                <Text fontWeight="bold" fontSize="sm">{chat.title}</Text>
                                <Text fontSize="xs" noOfLines={1}>{chat.snippet}</Text>
                            </Box>
                        ))}
                    </VStack>
                </Box>

                <Divider />


            </VStack>
        </Box>
    );
};

export default SidebarAI;
