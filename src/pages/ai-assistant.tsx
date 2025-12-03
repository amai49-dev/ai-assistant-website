import { Box, Button, Center, Grid, Heading, Image, Text, VStack, Flex } from "@chakra-ui/react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function Page2() {
    return (
        <Box>
            <Navbar />

            {/* 💡 1. Main Container: ใช้ Flex เพื่อกำหนด h="calc(100vh - 64px)" และควบคุมการจัดวาง */}
            {/* 64px คือความสูงโดยประมาณของ Navbar */}
            <Flex direction="column" h="calc(100vh - 64px)" overflow="hidden">

                {/* 2. Top Navigation Buttons (Header/Controls) */}
                <Flex gap={4} mt={4} px={4}>
                    <Box p={0}
                        bg="white"
                        borderRadius="md"
                        boxShadow="md"
                        borderColor="gray.200"
                        borderWidth="1px"
                        textAlign="center"
                        padding="4"
                        rounded="full"
                        transition="all 0.3s ease"
                        cursor="pointer"
                        onClick={() => window.location.href = "/"}
                        _hover={{
                            borderColor: "blue.500",
                            boxShadow: "0 4px 20px 0 rgba(59, 130, 246, 0.4)",
                            transform: "translateY(-1px)",
                        }}
                    >
                        <Text>กลับสู่หน้าแรก</Text>
                    </Box>
                    <Box p={0}
                        bg="white"
                        borderRadius="md"
                        boxShadow="md"
                        borderColor="gray.200"
                        borderWidth="1px"
                        textAlign="center"
                        padding="4"
                        rounded="full"
                        transition="all 0.3s ease"
                        cursor="pointer"
                        onClick={() => window.location.href = "/meeting-management"}
                        _hover={{
                            borderColor: "blue.500",
                            boxShadow: "0 4px 20px 0 rgba(59, 130, 246, 0.4)",
                            transform: "translateY(-1px)",
                        }}
                    >
                        <Text>Meeting Management</Text>
                    </Box>
                </Flex>

                {/* 3. Main Content Centering Area */}
                <Flex
                    flex="1" // 💡 ขยายเต็มพื้นที่ความสูงที่เหลือจากปุ่มด้านบน
                    alignItems="center" // 💡 จัดให้อยู่กึ่งกลางแนวตั้ง (Vertical Center)
                    justifyContent="center" // 💡 จัดให้อยู่กึ่งกลางแนวนอน (Horizontal Center)
                    p={6} // Padding โดยรอบเนื้อหา
                    overflowY="auto" // อนุญาตให้ Scroll ได้เฉพาะส่วนเนื้อหาถ้าหน้าจอเล็กเกินไป
                >
                    {/* Content Wrapper: ห่อ VStack และ Grid ให้เป็นบล็อกเดียวเพื่อการจัดกึ่งกลาง */}
                    <VStack
                        spacing={8}
                        align="center"
                        maxW="800px"
                        w="full"
                    >
                        {/* ส่วนหัวข้อ (เดิมคือ VStack) */}
                        <VStack spacing={4} textAlign="center" mb={8}>
                            <Heading as="h2" size="lg">สวัสดี, Admin</Heading>
                            <Heading as="h2" size="md" color="gray.600">คุณสามารถเลือกผู้ช่วย AI อัจฉริยะได้ที่นี่</Heading>
                        </VStack>

                        {/* ส่วน Grid */}
                        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6} maxW="800px" minW="600px" w="full">
                            {[
                                { title: "General AI", desc: "สอบถามเรื่องทั่วไป", link: "/ai-chat" },
                                { title: "HR Care", desc: "ให้คำแนะนำเกี่ยวกับการดูแลพนักงาน และทรัพยากรบุคคล", link: "#" },
                                { title: "Product Expert", desc: "ให้คำแนะนำเกี่ยวกับผลิตภัณฑ์ของคุณ", link: "#" },
                                { title: "Market Expert", desc: "ให้คำแนะนำเกี่ยวกับตลาดและการวิเคราะห์", link: "#" },
                            ].map((item, i) => (
                                <Box
                                    key={i}
                                    p={6}
                                    bg="white"
                                    borderRadius="md"
                                    boxShadow="md"
                                    borderColor="gray.200"
                                    borderWidth="1px"
                                    textAlign="left"
                                    transition="all 0.3s ease"
                                    _hover={{
                                        borderColor: "blue.500",
                                        boxShadow: "0 4px 20px 0 rgba(59, 130, 246, 0.4)",
                                        transform: "translateY(-4px)",
                                    }}
                                    cursor="pointer"
                                    onClick={() => window.location.href = item.link}
                                >
                                    <Text mb={4} fontWeight="bold" textColor="blue.800">{item.title}</Text>
                                    <Text mb={4}>{item.desc}</Text>
                                </Box>
                            ))}
                        </Grid>
                    </VStack>
                </Flex>
            </Flex>
        </Box>
    );
}