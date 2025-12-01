// pages/ai-chat.tsx
import {
  Box,
  Button,
  Flex,
  Input,
  VStack,
  HStack,
  Link as ChakraLink,
} from "@chakra-ui/react";
import { useState, useEffect, useRef } from "react";
import Navbar from "../components/Navbar";
import SidebarAI from "../components/SidebarAI";

interface Message {
  id: string;
  role: "user" | "ai";
  content: string;
}

const uuid = () => crypto.randomUUID();

export default function AIChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const chatContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages]); // scroll ทุกครั้งที่ messages เปลี่ยน


  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput("");

    // user message bubble
    const userId = uuid();
    setMessages((prev) => [
      ...prev,
      { id: userId, role: "user", content: userMessage },
    ]);

    // thinking bubble
    const thinkingId = uuid();
    setMessages((prev) => [
      ...prev,
      { id: thinkingId, role: "ai", content: "กำลังประมวลผล..." },
    ]);

    try {
      // ❗ ไม่มี timeout — fetch จะรอไปเรื่อย ๆ
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await res.json();
      console.log('data', data);

      let replyText = "AI ไม่มีข้อความตอบกลับ";

      if (Array.isArray(data)) {
        // data เป็น array ของ object ที่มี key 'text'
        replyText = data.map((m: any) => m.text).join("\n\n");
      } else if (data.reply) {
        replyText = data.reply;
      }


      // replace bubble
      // แทน thinking bubble replace
      setMessages(prev =>
        prev.map(m =>
          m.id === thinkingId
            ? {
              ...m,
              content: data.map((item: any) => item.text || item.url).join("\n\n"),
              type: data.map((item: any) => item.type)[0] // ใช้ type จาก data
            }
            : m
        )
      );
    } catch (err) {
      console.error("AI fetch error:", err);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === thinkingId
            ? { ...msg, content: "เกิดข้อผิดพลาดในการเชื่อมต่อ AI" }
            : msg
        )
      );
    }
  };

  return (
    <Box>
      <Navbar />
      <Flex>
        <SidebarAI />

        <Flex flex="1" direction="column" p={6} minH="calc(100vh - 64px)">
          <Box
            ref={chatContainerRef}
            flex="1"
            overflowY="auto"
            mb={4}
            p={4}
            bg="gray.50"
            borderRadius="md"
            boxShadow="sm"
            display="flex"
            flexDirection="column"
          >
            <VStack spacing={4} align="stretch" flex="1">
              {messages.map((msg: any) => (
                <Box
                  key={msg.id}
                  alignSelf={msg.role === "user" ? "flex-end" : "flex-start"}
                  bg={msg.role === "user" ? "blue.500" : "gray.200"}
                  color={msg.role === "user" ? "white" : "black"}
                  px={4}
                  py={2}
                  borderRadius="md"
                  maxW="70%"
                  whiteSpace="pre-wrap"
                  wordBreak="break-word"
                >
                  {msg.type === "link" ? (
                    <ChakraLink
                      href={msg.content}
                      color={msg.role === "user" ? "white" : "blue.600"}
                      isExternal
                    >
                      {msg.content}
                    </ChakraLink>
                  ) : (
                    msg.content
                  )}
                </Box>
              ))}
            </VStack>
          </Box>

          <HStack>
            <Input
              placeholder="พิมพ์ข้อความ..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") sendMessage();
              }}
            />
            <Button colorScheme="blue" onClick={sendMessage}>
              ส่ง
            </Button>
          </HStack>
        </Flex>
      </Flex>
    </Box>
  );
}
