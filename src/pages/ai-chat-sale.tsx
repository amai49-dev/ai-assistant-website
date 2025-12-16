import {
  Box,
  Button,
  Flex,
  VStack,
  HStack,
  Text,
  Icon,
  Center,
  Image,
} from "@chakra-ui/react";
import { FaDownload, FaPlus } from "react-icons/fa";
import { useState, useEffect, useRef } from "react";
import NavbarAI from "../components/NavbarAI";
import SidebarAI from "../components/SidebarAI";
import { useRouter } from "next/router";
import ChatInputBeta from "../components/ChatInputBeta";
import MarkdownMessage from "../components/MarkdownMessage";

interface Message {
  type?: "text" | "link";
  role: "user" | "ai";
  text?: string;
  content: string;
  id: string;
  fileName?: string;
}

const uuid = () => crypto.randomUUID();

export default function AIChatSale() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const chatContainerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // keep prev length to detect additions
  const prevMessagesLenRef = useRef<number>(0);
  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };
  // Scroll only when messages length increases (new message added)
  useEffect(() => {
    const prevLen = prevMessagesLenRef.current;
    const currLen = messages.length;
    // if increased, scroll bottom
    if (currLen > prevLen && chatContainerRef.current) {
      // small timeout to allow DOM to paint new message
      requestAnimationFrame(() => {
        try {
          chatContainerRef.current!.scrollTop = chatContainerRef.current!.scrollHeight;
        } catch (e) {
          /* ignore */
        }
      });
    }
    // prevMessagesLenRef.current = currLen;
    scrollToBottom()
  }, [messages]);

  const sendMessage = async (userMessage: string) => {
    if (!userMessage.trim() || isLoading) return;

    setIsLoading(true);

    const userId = uuid();
    // append user message
    setMessages((prev) => [
      ...prev,
      { id: userId, role: "user", content: userMessage },
    ]);

    // thinking indicator
    const thinkingId = uuid();
    setMessages((prev) => [
      ...prev,
      { id: thinkingId, role: "ai", content: "กำลังประมวลผล..." },
    ]);

    try {
      const res = await fetch("/api/chat-sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await res.json();

      // remove thinking
      setMessages((prev) => prev.filter((m) => m.id !== thinkingId));

      let replies: any[] = [];
      if (Array.isArray(data)) {
        replies = data;
      } else if (data.reply) {
        replies = [{ type: "text", text: data.reply }];
      } else {
        replies = [{ type: "text", text: "AI ไม่มีข้อความตอบกลับ" }];
      }

      const newMessages: Message[] = replies.map((replyData) => ({
        id: uuid(),
        role: "ai",
        content: replyData.url || replyData.text || "",
        type: replyData.type || "text",
        fileName: replyData.fileName,
      }));

      setMessages((prev) => [...prev, ...newMessages]);
      setTimeout(() => {
        scrollToBottom();
        inputRef.current?.focus();   // <<--- โฟกัส input อีกครั้ง
      }, 50);
    } catch (err) {
      console.error("AI fetch error:", err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.content === "กำลังประมวลผล..."
            ? { ...msg, content: "เกิดข้อผิดพลาดในการเชื่อมต่อ AI", type: "text" }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = (url: string, fileName: string) => {
    window.open(url, "_blank");
    console.log(`Attempting to download ${fileName} from ${url}`);
  };

  const getCleanFileName = (url: string, fallbackName: string): string => {
    let fileNamePart = url.substring(url.lastIndexOf("/") + 1);
    const queryIndex = fileNamePart.indexOf("?");
    if (queryIndex !== -1) {
      fileNamePart = fileNamePart.substring(0, queryIndex);
    }
    if (url.includes("?filename=")) {
      try {
        const urlObj = new URL(url);
        const filenameParam = urlObj.searchParams.get("filename");
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

  // WelcomeScreen (unchanged styling but uses parent's sendMessage)
  const WelcomeScreen = () => (
    <Center flex="1" h="100%" bg="gray.50">
      <VStack spacing={8} p={4}>
        <Image src="/amai-logo.png" alt="AM AI Logo" maxH="80px" mb={4} />

        <Text mt={8} fontSize="xl" color="gray.600" textAlign="center" fontWeight="bold">
          สวัสดี! ฉันคือ AI Market Expert พร้อมช่วยเหลือคุณในการวิเคราะห์ตลาดและให้คำแนะนำทางธุรกิจ
        </Text>

        <VStack spacing={3} w="full" bgColor="white" p={6} borderRadius="lg" boxShadow="lg" minW={{ base: "90vw", md: "700px" }}>
          <ChatInputBeta inputRef={inputRef} onSend={sendMessage} isLoading={isLoading} autoFocus />

          <HStack spacing={3} pt={2} w="full" justify="start">
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

  // ChatScreen: NOTE - no input state here; only messages render and single scroll container
  const ChatScreen = () => (
    <Flex flex="1" direction="column" overflow="hidden" p={6} pt="64px" px={{ base: 4, md: 48 }} pb={16} h="100%" position="relative" bg="gray.50">
      <Box ref={chatContainerRef} flex="1" overflowY="auto" p={4} pb="120px">
        <VStack spacing={4} align="stretch">
          {messages.map((msg: Message) => {
            if (msg.role === "ai" && msg.type === "link") {
              const url = msg.content;
              const displayFileName = getCleanFileName(url, "ไฟล์ดาวน์โหลด");
              return (
                <Box key={msg.id} alignSelf="flex-start" bg="blue.50" border="1px solid" borderColor="blue.200" px={4} py={3} borderRadius="lg" maxW="70%" boxShadow="sm">
                  <Text mb={2} fontWeight="bold" color="blue.700" noOfLines={1} title={displayFileName}>
                    {displayFileName}
                  </Text>
                  <Button size="sm" colorScheme="blue" w="full" leftIcon={<Icon as={FaDownload} />} onClick={() => handleDownload(url, displayFileName)} isLoading={isLoading}>
                    ดาวน์โหลด
                  </Button>
                </Box>
              );
            }

            return (
              <Box key={msg.id} alignSelf={msg.role === "user" ? "flex-end" : "flex-start"} bg={msg.role === "user" ? "blue.600" : "white"} color={msg.role === "user" ? "white" : "gray.800"} px={4} py={2} borderRadius="2xl" border={msg.role === "ai" ? "1px solid" : "none"} borderColor={msg.role === "ai" ? "gray.200" : "transparent"} maxW="80%" whiteSpace="pre-wrap" wordBreak="break-word" boxShadow={msg.role === "ai" ? "sm" : "md"} opacity={msg.content === "กำลังประมวลผล..." ? 0.7 : 1}>
                {msg.role === 'ai'
                  ? <MarkdownMessage content={msg.content} />
                  : msg.content
                }
              </Box>
            );
          })}
        </VStack>
      </Box>

      <Box position="sticky" bottom="0" bg="white" p={4} boxShadow="lg" borderRadius="xl" zIndex={10}>
        <ChatInputBeta inputRef={inputRef} onSend={sendMessage} isLoading={isLoading} />
      </Box>
    </Flex>
  );

  return (
    <Box h="100vh" overflow="hidden" position="relative">
      <NavbarAI />
      <Flex h="100%">
        <SidebarAI />

        <Box display={messages.length === 0 ? "block" : "none"} flex="1">
          <WelcomeScreen />
        </Box>

        <Box display={messages.length === 0 ? "none" : "block"} flex="1">
          <ChatScreen />
        </Box>
      </Flex>

      <Image position="absolute" src="/Vector.png" alt="Background Vector" top="0" right="0" zIndex="1" pointerEvents="none" />
      <Image position="absolute" src="/Vector-1.png" alt="Background Vector" bottom="0" right="100px" zIndex="1" pointerEvents="none" />
      <Image position="absolute" src="/Vector-2.png" alt="Background Vector" top="0" left="0" zIndex="1" pointerEvents="none" />
    </Box>
  );
}
