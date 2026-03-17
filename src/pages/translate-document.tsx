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
  Spinner,
  useToast,
} from "@chakra-ui/react";
import { FaDownload } from "react-icons/fa";
import { ImAttachment } from "react-icons/im";
import { FiTrash2 } from "react-icons/fi";
import { useState, useRef } from "react";
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

// ------------------- Page -------------------

interface TranslationResult {
  fileName: string;
  blobUrl: string;
}

export default function TranslateDocument() {
  const [file, setFile] = useState<File | null>(null);
  const [instruction, setInstruction] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TranslationResult | null>(null);
  const [error, setError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    const ext = selected.name.slice(selected.name.lastIndexOf(".")).toLowerCase();
    if (ext !== ".pdf" && ext !== ".pptx") {
      toast({
        title: "ไม่รองรับประเภทไฟล์นี้",
        description: "รองรับเฉพาะไฟล์ .pdf และ .pptx เท่านั้น",
        status: "error",
        duration: 4000,
      });
      e.target.value = "";
      return;
    }

    setFile(selected);
    setResult(null);
    setError("");
  };

  const handleRemoveFile = () => {
    setFile(null);
    setResult(null);
    setError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleTranslate = async () => {
    if (!file) return;

    const userInstruction = instruction.trim() || "Translate to English";

    setIsLoading(true);
    setResult(null);
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("message", userInstruction);

      const res = await fetch("/api/translate-document", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "เกิดข้อผิดพลาดในการแปลเอกสาร");
        return;
      }

      const blobUrl = base64ToBlobUrl(data.fileData, data.mimeType);
      setResult({ fileName: data.fileName, blobUrl });

      toast({
        title: "แปลเอกสารสำเร็จ",
        description: data.fileName,
        status: "success",
        duration: 4000,
      });
    } catch (err) {
      console.error("Translate error:", err);
      setError("เกิดข้อผิดพลาดในการเชื่อมต่อ กรุณาลองใหม่");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box h="100vh" overflow="hidden" position="relative">
      <NavbarAI />
      <Flex h="100%">
        <SidebarAI />

        <Center flex="1" bg="gray.50" pt="64px">
          <VStack spacing={6} p={4} w="full" maxW="600px">

            {/* ------------------- Header ------------------- */}
            <VStack spacing={2}>
              <Text fontSize="2xl" fontWeight="bold" color="gray.800">
                แปลเอกสาร
              </Text>
              <Text fontSize="sm" color="gray.500" textAlign="center">
                อัปโหลดไฟล์ PDF หรือ PPTX แล้วระบุภาษาที่ต้องการแปล
              </Text>
            </VStack>

            {/* ------------------- Upload Card ------------------- */}
            <Box
              w="full"
              bg="white"
              borderRadius="xl"
              boxShadow="lg"
              p={8}
            >
              <VStack spacing={5}>

                {/* File Upload Area */}
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
                    borderColor="gray.300"
                    borderRadius="lg"
                    p={8}
                    textAlign="center"
                    cursor="pointer"
                    _hover={{ borderColor: "blue.400", bg: "blue.50" }}
                    transition="all 0.2s"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <VStack spacing={3}>
                      <Icon as={ImAttachment} boxSize={8} color="gray.400" />
                      <Text fontWeight="medium" color="gray.600">
                        คลิกเพื่อเลือกไฟล์
                      </Text>
                      <Text fontSize="xs" color="gray.400">
                        รองรับ .pdf และ .pptx (สูงสุด 50MB)
                      </Text>
                    </VStack>
                  </Box>
                ) : (
                  <HStack
                    w="full"
                    p={4}
                    bg="blue.50"
                    borderRadius="lg"
                    border="1px solid"
                    borderColor="blue.200"
                    justify="space-between"
                  >
                    <HStack spacing={3} flex="1" minW={0}>
                      <Icon as={ImAttachment} color="blue.500" boxSize={5} />
                      <VStack align="start" spacing={0} flex="1" minW={0}>
                        <Text fontWeight="medium" color="blue.700" noOfLines={1}>
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
                  size="lg"
                  borderRadius="lg"
                  isDisabled={isLoading}
                />

                {/* Translate Button */}
                <Button
                  colorScheme="blue"
                  size="lg"
                  w="full"
                  borderRadius="lg"
                  onClick={handleTranslate}
                  isDisabled={!file || isLoading}
                  isLoading={isLoading}
                  loadingText="กำลังแปลเอกสาร..."
                >
                  แปลเอกสาร
                </Button>

                {/* Error */}
                {error && (
                  <Text color="red.500" fontSize="sm" textAlign="center">
                    {error}
                  </Text>
                )}

                {/* Loading Progress */}
                {isLoading && (
                  <VStack spacing={2} py={2}>
                    <Spinner size="sm" color="blue.500" />
                    <Text fontSize="sm" color="gray.500">
                      กำลังแปลเอกสาร อาจใช้เวลาสักครู่...
                    </Text>
                  </VStack>
                )}

                {/* Result */}
                {result && (
                  <Box
                    w="full"
                    p={4}
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
