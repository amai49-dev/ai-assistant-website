import {
  Box,
  Button,
  Flex,
  Input,
  VStack,
  HStack,
  Text,
  Icon,
  // นำเข้าอื่นๆ
  Center,
  Heading,
  Image,
  InputGroup,
  InputRightElement,
} from "@chakra-ui/react";
import { FaDownload, FaPlus } from "react-icons/fa";
// 💡 เพิ่ม useCallback
import { useState, useEffect, useRef, useCallback } from "react";
import NavbarAI from "../components/NavbarAI";
import SidebarAI from "../components/SidebarAI";
import { IoIosSend } from "react-icons/io";
import { useRouter } from "next/router";
import ChatInput from "../components/ChatInput";

//... (Message Interface และ uuid function ยังคงเดิม)
interface Message {
  type?: "text" | "link";
  role: "user" | "ai";
  text?: string;
  content: string;
  id: string;
  fileName?: string;
}

const uuid = () => crypto.randomUUID();
//...

export default function AIChat() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement>(null);

  // ... (useEffect, sendMessage, handleDownload, getCleanFileName functions ยังคงเดิม)

  useEffect(() => {
    if (chatContainerRef.current) {
      if (!isLoading) {
        chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
      }
    }
  }, [messages, isLoading]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput("");
    setIsLoading(true);

    const userId = uuid();
    setMessages((prev) => [
      ...prev,
      { id: userId, role: "user", content: userMessage },
    ]);

    const thinkingId = uuid();
    setMessages((prev) => [
      ...prev,
      { id: thinkingId, role: "ai", content: "กำลังประมวลผล..." },
    ]);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await res.json();
      console.log('data', data);

      setMessages(prev => prev.filter(m => m.id !== thinkingId));

      let replies: any[] = [];
      if (Array.isArray(data)) {
        replies = data;
      } else if (data.reply) {
        replies = [{ type: "text", text: data.reply }];
      } else {
        replies = [{ type: "text", text: "AI ไม่มีข้อความตอบกลับ" }];
      }

      setMessages(prev => {
        const newMessages: Message[] = replies.map(replyData => ({
          id: uuid(),
          role: "ai",
          content: replyData.url || replyData.text || "",
          type: replyData.type || "text",
          fileName: replyData.fileName,
        }));

        return [...prev, ...newMessages];
      });

    } catch (err) {
      console.error("AI fetch error:", err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === thinkingId
            ? { ...msg, content: "เกิดข้อผิดพลาดในการเชื่อมต่อ AI", type: "text" }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (url: string, fileName: string) => {
    window.open(url, '_blank');
    console.log(`Attempting to download ${fileName} from ${url}`);
  };

  const getCleanFileName = (url: string, fallbackName: string): string => {
    let fileNamePart = url.substring(url.lastIndexOf('/') + 1);
    const queryIndex = fileNamePart.indexOf('?');
    if (queryIndex !== -1) {
      fileNamePart = fileNamePart.substring(0, queryIndex);
    }
    if (url.includes('?filename=')) {
      try {
        const urlObj = new URL(url);
        const filenameParam = urlObj.searchParams.get('filename');
        if (filenameParam) {
          return decodeURIComponent(filenameParam);
        }
      } catch (e) {
        console.error("Invalid URL format:", e);
      }
    }
    if (fileNamePart) {
      return decodeURIComponent(fileNamePart);
    }
    return fallbackName;
  };


  // 2. 🖼️ Component สำหรับหน้าจอเริ่มต้น (Hero/Welcome Screen) (ใช้ useCallback)
  const WelcomeScreen = () => (
    <Center
      flex="1"
      h="calc(100vh)"
      bg="gray.50"
    >
      <VStack spacing={8} p={4}>
        <Image
          src="/amai-logo.png"
          alt="AM AI Logo"
          maxH="80px"
          mb={4}
        />

        <Text mt={8} fontSize="xl" color="gray.600" textAlign="center" fontWeight="bold">
          How can 'AM AI 49' help you today?
        </Text>

        <VStack
          spacing={3}
          w="full"
          bgColor="white"
          p={6}
          borderRadius="lg"
          boxShadow="lg"
          minW={{ base: "90vw", md: "700px" }}
        >
          {/* 💡 เรียกใช้ ChatInputBar ที่เป็น useCallback */}
          <ChatInput
            input={input}
            setInput={setInput}
            sendMessage={sendMessage}
            isLoading={isLoading}
            isWelcomeScreen={true}
            autoFocus={true}
          />

          {/* 💡 Quick Action Buttons (ปุ่มแนะนำ) */}
          <HStack spacing={3} pt={2} w="full" justify="start" >
            <Button size="sm" variant="outline" borderRadius="full" leftIcon={<Icon as={FaPlus} />}>
              สร้างบทสรุป
            </Button>
            <Button size="sm" variant="outline" borderRadius="full">
              แนวคิดผลิตภัณฑ์ใหม่
            </Button>
            <Button size="sm" variant="outline" borderRadius="full">
              ข้อมูลส่วนลดและโปรโมชัน
            </Button>
          </HStack>
        </VStack>
      </VStack>
    </Center>
  );

  // 3. 💬 Component สำหรับหน้าจอแชทปกติ (ใช้ useCallback)
  const ChatScreen = () => (
    <Flex
      flex="1"
      direction="column"
      p={6}
      mt="64px"
      h="calc(100vh - 64px)"
      position="relative"
      bg="gray.50"
    >
      {/* Chat container */}
      <Box
        ref={chatContainerRef}
        flex="1"
        overflowY="auto"
        p={4}
        mb="10px"  // ← กันพื้นที่ให้ input bar ไม่ทับข้อความ
      >
        <VStack spacing={4} align="stretch">
          {messages.map((msg: Message) => {
            // 🖼️ Component สำหรับ Link/Download
            if (msg.role === "ai" && msg.type === "link") {
              const url = msg.content;
              const displayFileName = getCleanFileName(url, "ไฟล์ดาวน์โหลด");
              return (
                <Box
                  key={msg.id}
                  alignSelf="flex-start"
                  bg="blue.50"
                  border="1px solid"
                  borderColor="blue.200"
                  px={4}
                  py={3}
                  borderRadius="lg"
                  maxW="70%"
                  boxShadow="sm"
                >
                  <Text mb={2} fontWeight="bold" color="blue.700" noOfLines={1} title={displayFileName}>
                    {displayFileName}
                  </Text>
                  <Button
                    size="sm"
                    colorScheme="blue"
                    w="full"
                    leftIcon={<Icon as={FaDownload} />}
                    onClick={() => handleDownload(url, displayFileName)}
                    isLoading={isLoading}
                  >
                    ดาวน์โหลด
                  </Button>
                </Box>
              );
            }

            // 💬 ข้อความธรรมดา (Text Bubble)
            return (
              <Box
                key={msg.id}
                alignSelf={msg.role === "user" ? "flex-end" : "flex-start"}
                bg={msg.role === "user" ? "blue.600" : "white"}
                color={msg.role === "user" ? "white" : "gray.800"}
                px={4}
                py={2}
                borderRadius={msg.role === "user" ? "2xl" : "2xl"}
                border={msg.role === "ai" ? "1px solid" : "none"}
                borderColor={msg.role === "ai" ? "gray.200" : "transparent"}
                maxW="80%"
                whiteSpace="pre-wrap"
                wordBreak="break-word"
                boxShadow={msg.role === "ai" ? "sm" : "md"}
                opacity={msg.id.includes('thinking') ? 0.7 : 1}
              >
                {msg.content}
              </Box>
            );
          })}

        </VStack>
      </Box>

      {/* Chat input bar fixed-bottom (จริง) */}
      <Box
        position="sticky"
        bottom="0"
        bg="white"
        p={4}
        boxShadow="lg"
        borderRadius="xl"
        zIndex={10}
      >
        <ChatInput
          input={input}
          setInput={setInput}
          sendMessage={sendMessage}
          isLoading={isLoading}
          isWelcomeScreen={false}
          autoFocus={false}
        />
      </Box>
    </Flex>
  );


  return (
    <Box>
      <NavbarAI />
      <Flex>
        <SidebarAI />

        {/* ✔ ใช้ display: none แทน */}
        <Box display={messages.length === 0 ? "block" : "none"} flex="1">
          <WelcomeScreen />
        </Box>

        <Box display={messages.length === 0 ? "none" : "block"} flex="1">
          <ChatScreen />
        </Box>

      </Flex>
    </Box>
  );
}