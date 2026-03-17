import {
  Box,
  Button,
  Flex,
  VStack,
  HStack,
  Text,
  Icon,
  Center,
  Input,
  Progress,
  useToast,
} from "@chakra-ui/react";
import { FaDownload } from "react-icons/fa";
import { ImAttachment } from "react-icons/im";
import { FiTrash2 } from "react-icons/fi";
import { useState, useRef, useCallback } from "react";
import NavbarAI from "../components/NavbarAI";
import SidebarAI from "../components/SidebarAI";

// ------------------- Helpers -------------------

function base64ToBlobUrl(base64: string, mimeType: string): string {
  const byteChars = atob(base64);
  const byteNumbers = new Array(byteChars.length);
  for (let i = 0; i < byteChars.length; i++) {
    byteNumbers[i] = byteChars.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });
  return URL.createObjectURL(blob);
}

function handleDownload(url: string, fileName: string) {
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// ------------------- Types -------------------

interface TranslationResult {
  fileName: string;
  blobUrl: string;
}

interface TranslationProgress {
  currentPage: number;
  totalPages: number;
  status: string; // "translating" | "building"
}

// ------------------- Page -------------------

export default function TranslateDocument() {
  const [file, setFile] = useState<File | null>(null);
  const [instruction, setInstruction] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<TranslationProgress | null>(null);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [error, setError] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  // ------------------- File Validation -------------------
  const validateAndSetFile = useCallback((selected: File) => {
    const ext = selected.name.slice(selected.name.lastIndexOf(".")).toLowerCase();
    if (ext !== ".pdf" && ext !== ".pptx") {
      toast({
        title: "ไม่รองรับประเภทไฟล์นี้",
        description: "รองรับเฉพาะไฟล์ .pdf และ .pptx เท่านั้น",
        status: "error",
        duration: 4000,
      });
      return;
    }
    setFile(selected);
    setResult(null);
    setError("");
  }, [toast]);

  // ------------------- File Input Handler -------------------
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) validateAndSetFile(selected);
  };

  const handleRemoveFile = () => {
    setFile(null);
    setResult(null);
    setError("");
    setProgress(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // ------------------- Drag & Drop -------------------
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const dropped = e.dataTransfer.files?.[0];
    if (dropped) validateAndSetFile(dropped);
  }, [validateAndSetFile]);

  // ------------------- Translate (Stream) -------------------
  const handleTranslate = async () => {
    if (!file) return;

    const userInstruction = instruction.trim() || "Translate to English";

    setIsLoading(true);
    setResult(null);
    setError("");
    setProgress(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("message", userInstruction);

      const res = await fetch("/api/translate-document", {
        method: "POST",
        body: formData,
      });

      if (!res.ok && !res.body) {
        setError(res.status === 413
          ? "ไฟล์มีขนาดใหญ่เกินขีดจำกัดของเซิร์ฟเวอร์"
          : "เกิดข้อผิดพลาดในการแปลเอกสาร");
        return;
      }

      // อ่าน NDJSON stream
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || ""; // เก็บ incomplete line ไว้

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const event = JSON.parse(line);

            if (event.type === "start") {
              setProgress({ currentPage: 0, totalPages: event.total, status: "translating" });
            } else if (event.type === "progress") {
              setProgress({
                currentPage: event.page,
                totalPages: event.total,
                status: event.status === "building" ? "building" : "translating",
              });
            } else if (event.type === "done") {
              const blobUrl = base64ToBlobUrl(event.fileData, event.mimeType);
              setResult({ fileName: event.fileName, blobUrl });
              toast({ title: "แปลเอกสารสำเร็จ", description: event.fileName, status: "success", duration: 4000 });
            } else if (event.type === "error") {
              setError(event.error || "เกิดข้อผิดพลาดในการแปลเอกสาร");
            }
          } catch {
            // ข้าม JSON parse errors
          }
        }
      }
    } catch (err) {
      console.error("Translate error:", err);
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่");
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  };

  // ------------------- Progress Text -------------------
  const progressText = progress
    ? progress.status === "building"
      ? "กำลังสร้างไฟล์..."
      : `กำลังแปลหน้า ${progress.currentPage} จาก ${progress.totalPages} หน้า`
    : "กำลังเตรียมเอกสาร...";

  const progressPercent = progress
    ? progress.status === "building"
      ? 95
      : Math.round((progress.currentPage / progress.totalPages) * 90)
    : 0;

  return (
    <Box h="100vh" overflow="hidden" position="relative">
      <NavbarAI />
      <Flex h="100%">
        <SidebarAI />

        <Center flex="1" bg="gray.50" pt="64px" overflowY="auto">
          <VStack
            spacing={{ base: 4, md: 6 }}
            p={{ base: 3, md: 4 }}
            w="full"
            maxW={{ base: "full", sm: "500px", md: "600px" }}
          >

            {/* ------------------- Header ------------------- */}
            <VStack spacing={1}>
              <Text fontSize={{ base: "xl", md: "2xl" }} fontWeight="bold" color="gray.800">
                แปลเอกสาร
              </Text>
              <Text fontSize={{ base: "xs", md: "sm" }} color="gray.500" textAlign="center">
                อัปโหลดไฟล์ PDF หรือ PPTX แล้วระบุภาษาที่ต้องการแปล
              </Text>
            </VStack>

            {/* ------------------- Upload Card ------------------- */}
            <Box
              w="full"
              bg="white"
              borderRadius="xl"
              boxShadow="lg"
              p={{ base: 4, md: 8 }}
            >
              <VStack spacing={{ base: 4, md: 5 }}>

                {/* File Upload Area (Click + Drag & Drop) */}
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".pdf,.pptx"
                  onChange={handleFileSelect}
                  style={{ display: "none" }}
                />

                {!file ? (
                  <Box
                    w="full"
                    border="2px dashed"
                    borderColor={isDragging ? "blue.500" : "gray.300"}
                    bg={isDragging ? "blue.50" : "transparent"}
                    borderRadius="lg"
                    p={{ base: 6, md: 8 }}
                    textAlign="center"
                    cursor="pointer"
                    _hover={{ borderColor: "blue.400", bg: "blue.50" }}
                    transition="all 0.2s"
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                  >
                    <VStack spacing={2}>
                      <Icon as={ImAttachment} boxSize={{ base: 6, md: 8 }} color={isDragging ? "blue.500" : "gray.400"} />
                      <Text fontWeight="medium" color={isDragging ? "blue.600" : "gray.600"} fontSize={{ base: "sm", md: "md" }}>
                        {isDragging ? "ปล่อยไฟล์ที่นี่" : "คลิกหรือลากไฟล์มาที่นี่"}
                      </Text>
                      <Text fontSize="xs" color="gray.400">
                        รองรับ .pdf และ .pptx (สูงสุด 50MB)
                      </Text>
                    </VStack>
                  </Box>
                ) : (
                  <HStack
                    w="full"
                    p={{ base: 3, md: 4 }}
                    bg="blue.50"
                    borderRadius="lg"
                    border="1px solid"
                    borderColor="blue.200"
                    justify="space-between"
                  >
                    <HStack spacing={{ base: 2, md: 3 }} flex="1" minW={0}>
                      <Icon as={ImAttachment} color="blue.500" boxSize={{ base: 4, md: 5 }} />
                      <VStack align="start" spacing={0} flex="1" minW={0}>
                        <Text fontWeight="medium" color="blue.700" noOfLines={1} fontSize={{ base: "sm", md: "md" }}>
                          {file.name}
                        </Text>
                        <Text fontSize="xs" color="blue.500">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </Text>
                      </VStack>
                    </HStack>
                    <Button
                      size="sm"
                      variant="ghost"
                      colorScheme="red"
                      onClick={handleRemoveFile}
                      isDisabled={isLoading}
                    >
                      <Icon as={FiTrash2} />
                    </Button>
                  </HStack>
                )}

                {/* Instruction Input */}
                <Input
                  placeholder="เช่น แปลเป็นภาษาไทย, Translate to English..."
                  value={instruction}
                  onChange={(e) => setInstruction(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && file && !isLoading) handleTranslate();
                  }}
                  size={{ base: "md", md: "lg" }}
                  borderRadius="lg"
                  isDisabled={isLoading}
                />

                {/* Translate Button */}
                <Button
                  colorScheme="blue"
                  size={{ base: "md", md: "lg" }}
                  w="full"
                  borderRadius="lg"
                  onClick={handleTranslate}
                  isDisabled={!file || isLoading}
                  isLoading={isLoading && !progress}
                  loadingText="กำลังเตรียมเอกสาร..."
                >
                  แปลเอกสาร
                </Button>

                {/* Error */}
                {error && (
                  <Text color="red.500" fontSize="sm" textAlign="center">
                    {error}
                  </Text>
                )}

                {/* Progress Indicator */}
                {isLoading && progress && (
                  <Box w="full" py={2}>
                    <VStack spacing={2}>
                      <HStack w="full" justify="space-between">
                        <Text fontSize="sm" color="gray.600">
                          {progressText}
                        </Text>
                        <Text fontSize="sm" fontWeight="bold" color="blue.600">
                          {progressPercent}%
                        </Text>
                      </HStack>
                      <Progress
                        value={progressPercent}
                        size="sm"
                        w="full"
                        borderRadius="full"
                        colorScheme="blue"
                        hasStripe
                        isAnimated
                      />
                    </VStack>
                  </Box>
                )}

                {/* Result */}
                {result && (
                  <Box
                    w="full"
                    p={{ base: 3, md: 4 }}
                    bg="green.50"
                    borderRadius="lg"
                    border="1px solid"
                    borderColor="green.200"
                  >
                    <VStack spacing={3}>
                      <Text fontWeight="bold" color="green.700">
                        แปลเอกสารสำเร็จ
                      </Text>
                      <Text fontSize="sm" color="green.600" noOfLines={1}>
                        {result.fileName}
                      </Text>
                      <Button
                        colorScheme="green"
                        w="full"
                        size={{ base: "md", md: "md" }}
                        leftIcon={<Icon as={FaDownload} />}
                        onClick={() => handleDownload(result.blobUrl, result.fileName)}
                      >
                        ดาวน์โหลดไฟล์ที่แปลแล้ว
                      </Button>
                    </VStack>
                  </Box>
                )}

              </VStack>
            </Box>

            {/* ------------------- Supported Formats ------------------- */}
            <HStack spacing={4} opacity={0.6}>
              <Text fontSize="xs" color="gray.500">
                รองรับ: PDF, PPTX
              </Text>
              <Text fontSize="xs" color="gray.500">
                |
              </Text>
              <Text fontSize="xs" color="gray.500">
                ขนาดสูงสุด: 50MB
              </Text>
            </HStack>

          </VStack>
        </Center>
      </Flex>
    </Box>
  );
}
