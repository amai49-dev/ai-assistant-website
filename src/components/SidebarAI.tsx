// components/SidebarAI.tsx
import { Box, VStack, Text, Select, Button, Divider, Flex } from "@chakra-ui/react";
import { IoCalendarOutline } from "react-icons/io5";
import { BiHome } from "react-icons/bi";
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
                <Flex
                    flex="1" // 💡 1. ขยาย Flex ให้เต็มความกว้างที่เหลือ
                    align="center"
                    justifyContent="center" // 💡 2. จัดวางเนื้อหา (ไอคอน) ให้อยู่ตรงกลางแนวนอน
                    mb={4}
                    gap={6}
                // เพิ่มความกว้างขั้นต่ำ (minW) ถ้าจำเป็น เพื่อให้แน่ใจว่า Flex มีพื้นที่ให้ขยาย
                // minW="100%" 
                >
                    <Box
                        p={2} // Padding รอบไอคอน
                        borderRadius="full" // ทำให้เป็นวงกลม
                        transition="all 0.2s ease-in-out" // 💡 ทำให้การเปลี่ยนสีและเงาไหลลื่น
                        cursor="pointer"
                        // 🎨 Drop Shadow และสีปกติ
                        boxShadow="md"
                        bg="white"
                        onClick={() => window.location.href = "/"}
                        _hover={{
                            // 💡 Hover Effects
                            color: "purple.600", // เปลี่ยนสีไอคอนเป็นสีม่วง
                            boxShadow: "lg", // ทำให้เงาเข้มขึ้น
                            transform: "translateY(-2px)", // ยกไอคอนขึ้นเล็กน้อย
                            bg: "blue.50", // พื้นหลังสีอ่อน
                        }}
                    >
                        <BiHome
                            size={32}
                            color="#174376ff" // สีเริ่มต้นของไอคอน
                        // 💡 **สำคัญ**: ลบ cursor="pointer" และ color ออกจาก Icon เพราะ Box จัดการแล้ว
                        />
                    </Box>

                    {/* ไอคอน IoCalendarOutline */}
                    <Box
                        p={2}
                        borderRadius="full"
                        transition="all 0.2s ease-in-out"
                        cursor="pointer"
                        // 🎨 Drop Shadow และสีปกติ
                        boxShadow="md"
                        bg="white"
                        onClick={() => window.location.href = "/meeting-management"}
                        _hover={{
                            // 💡 Hover Effects
                            color: "purple.600",
                            boxShadow: "lg",
                            transform: "translateY(-2px)",
                            bg: "blue.50",
                        }}
                    >
                        <IoCalendarOutline
                            size={32}
                            color="#174376ff" // สีเริ่มต้นของไอคอน
                        />
                    </Box>
                </Flex>
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
