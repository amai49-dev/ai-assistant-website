import {
  Box,
  Flex,
  Heading,
  Text,
  Button,
  VStack,
  HStack,
  IconButton,
  useColorModeValue,
  Divider,
} from "@chakra-ui/react";
import { FiTrash2, FiEdit3, FiCalendar } from "react-icons/fi";
import Navbar from "../components/Navbar";
import SidebarAI from "../components/SidebarAI";
import { useRouter } from "next/router";

export default function MeetingManagement() {
  const cardBg = useColorModeValue("white", "gray.700");
  const cardBorder = useColorModeValue("gray.200", "gray.600");
  const router = useRouter();
  // mock data (คุณจะเปลี่ยนเป็น API ได้ทีหลัง)
  const meetings = [
    {
      id: 1,
      title: "Project Review",
      date: "2025-12-05",
      time: "09:00 - 10:00",
      participants: ["test@gmail.com", "team@abc.com"],
      status: "upcoming",
    },
    {
      id: 2,
      title: "Sales Strategy Discussion",
      date: "2025-12-03",
      time: "14:00 - 15:00",
      participants: ["boss@company.com"],
      status: "past",
    },
  ];

  return (
    <Box>
      <Navbar />
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
          onClick={() => window.location.href = "/ai-assistant"}
          _hover={{
            borderColor: "blue.500",
            boxShadow: "0 4px 20px 0 rgba(59, 130, 246, 0.4)",
            transform: "translateY(-1px)",
          }}
        >
          <Text>AI Assistant</Text>
        </Box>
      </Flex>
      {/* Content */}
      <Flex flex="1" direction="column" p={8}>
        <Flex justify="space-between" align="center" mb={6}>
          <Heading size="lg">Meeting Management</Heading>

          <Button bgGradient="linear(to-r, blue.800, purple.600)" transition="all 0.3s ease" _hover={{ bgGradient: "linear(to-r, blue.600, purple.400)" }} color="white" leftIcon={<FiCalendar />} onClick={() => router.push("/schedule-meeting")}>
            Schedule New Meeting
          </Button>
        </Flex>

        {/* Upcoming */}
        <Heading size="md" mb={3}>Upcoming Meetings</Heading>
        <VStack align="stretch" spacing={4} mb={8}>
          {meetings
            .filter(m => m.status === "upcoming")
            .map(meeting => (
              <Box
                key={meeting.id}
                p={4}
                bg={cardBg}
                border="1px solid"
                borderColor={cardBorder}
                borderRadius="md"
                boxShadow="sm"
              >
                <Flex justify="space-between" align="center">
                  <Box>
                    <Text fontSize="lg" fontWeight="bold">{meeting.title}</Text>
                    <Text>{meeting.date} • {meeting.time}</Text>
                    <Text fontSize="sm" color="gray.500">
                      Participants: {meeting.participants.join(", ")}
                    </Text>
                  </Box>

                  <HStack spacing={2}>
                    <IconButton
                      icon={<FiEdit3 />}
                      aria-label="edit"
                      colorScheme="blue"
                      variant="ghost"
                      onClick={() => alert("Edit meeting")}
                    />
                    <IconButton
                      icon={<FiTrash2 />}
                      aria-label="delete"
                      colorScheme="red"
                      variant="ghost"
                      onClick={() => alert("Delete meeting")}
                    />
                  </HStack>
                </Flex>
              </Box>
            ))}
        </VStack>

        <Divider />

        {/* Past */}
        <Heading size="md" mb={3} mt={6}>Past Meetings</Heading>
        <VStack align="stretch" spacing={4}>
          {meetings
            .filter(m => m.status === "past")
            .map(meeting => (
              <Box
                key={meeting.id}
                p={4}
                bg={cardBg}
                border="1px solid"
                borderColor={cardBorder}
                borderRadius="md"
                boxShadow="sm"
              >
                <Flex justify="space-between" align="center">
                  <Box>
                    <Text fontSize="lg" fontWeight="bold">{meeting.title}</Text>
                    <Text>{meeting.date} • {meeting.time}</Text>
                    <Text fontSize="sm" color="gray.500">
                      Participants: {meeting.participants.join(", ")}
                    </Text>
                  </Box>

                  <HStack spacing={2}>
                    <IconButton
                      icon={<FiEdit3 />}
                      aria-label="edit"
                      colorScheme="blue"
                      variant="ghost"
                    />
                    <IconButton
                      icon={<FiTrash2 />}
                      aria-label="delete"
                      colorScheme="red"
                      variant="ghost"
                    />
                  </HStack>
                </Flex>
              </Box>
            ))}
        </VStack>
      </Flex>
    </Box>
  );
}
