// pages/index.tsx
import { Box, Button, Center, Grid, Heading, Text, VStack } from "@chakra-ui/react";
import Navbar from "../components/Navbar";
import { useRouter } from "next/router";

export default function Home() {
  const router = useRouter();

  return (
    <Box>
      <Navbar />
      <Center minH="calc(100vh - 64px)" flexDirection="column" px={4} bg="gray.50"> {/* เพิ่ม bg="gray.50" เพื่อให้พื้นหลังสอดคล้องกับหน้าใหม่ */}
        <VStack spacing={4} textAlign="center" mb={8}>
          <Heading as="h2" size="lg">สวัสดี, Admin</Heading>
          <Heading as="h2" size="md" color="gray.600">จัดการระบบของคุณ ด้วย AI อัจฉริยะ</Heading>
        </VStack>

        <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap={6} maxW="800px" minW="600px">
          <Box p={6} bg="white" borderRadius="md" boxShadow="xl" borderColor="gray.200" borderWidth="1px" textAlign="left">
            <Text mb={4} fontWeight="bold" textColor="blue.800">🤖 AI Assistant</Text>
            <Text mb={4}>พูดคุยกับ AI Assistant</Text>
            <Button bgGradient="linear(to-r, blue.800, purple.600)"  transition="all 0.3s ease" _hover={{ bgGradient: "linear(to-r, blue.600, purple.400)" }} width="full" textColor="white" onClick={() => router.push("/ai-assistant")}>Start Chat</Button>
          </Box>
          <Box p={6} bg="white" borderRadius="md" boxShadow="xl" borderColor="gray.200" borderWidth="1px" textAlign="left">
            <Text mb={4} fontWeight="bold" textColor="blue.800">🗓️ Meeting Management</Text>
            <Text mb={4}>จัดการการประชุมของคุณอย่างมีประสิทธิภาพ</Text>
            <Button 
                bgGradient="linear(to-r, blue.800, purple.600)"  
                transition="all 0.3s ease" 
                _hover={{ bgGradient: "linear(to-r, blue.600, purple.400)" }} 
                width="full" 
                textColor="white" 
                onClick={() => router.push("/meeting-management")} // เปลี่ยน path เป็น /schedule-meeting
            >
                Start Management
            </Button>
          </Box>
        </Grid>
      </Center>
    </Box>
  );
}