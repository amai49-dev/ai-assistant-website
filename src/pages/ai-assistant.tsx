// pages/page2.tsx
import { Box, Button, Center, Grid, Heading, Image, Text, VStack, Flex } from "@chakra-ui/react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";

export default function Page2() {
    return (
        <Box>
            <Navbar />
            <Flex>
                <Sidebar />
                <Box flex="1" p={6}>
                    <Center minH="calc(100vh - 64px)" flexDirection="column" px={4}>
                        <VStack spacing={4} textAlign="center" mb={8}>
                            <Heading as="h2" size="lg">สวัสดี, Admin</Heading>
                            <Heading as="h2" size="md" color="gray.600">คุณสามารถเลือกผู้ช่วย AI อัจฉริยะได้ที่นี่</Heading>
                        </VStack>

                        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6} maxW="800px" minW="600px">
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
                                        boxShadow: "0 4px 20px 0 rgba(59, 130, 246, 0.4)", // shadow แบบ gradient/สีฟ้า
                                        transform: "translateY(-4px)", // optional effect ลอยขึ้นเล็กน้อย
                                    }}
                                    cursor="pointer"
                                    onClick={() => window.location.href = item.link}
                                >
                                    <Text mb={4} fontWeight="bold" textColor="blue.800">{item.title}</Text>
                                    <Text mb={4}>{item.desc}</Text>
                                </Box>
                            ))}
                        </Grid>

                    </Center>
                </Box>
            </Flex>
        </Box>
    );
}
