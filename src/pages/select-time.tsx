// pages/select-time.tsx

import {
    Box,
    Button,
    Center,
    VStack,
    Heading,
    Text,
    Flex,
    Grid,
    useToast,
    HStack,
    Badge,
    Divider,
    IconButton,
} from "@chakra-ui/react";
import Navbar from "../components/Navbar";
import { useRouter } from "next/router";
import { useState, useMemo } from "react";
import { ArrowBackIcon, RepeatIcon, TimeIcon, CheckCircleIcon, CloseIcon } from "@chakra-ui/icons";

// ------------------- REAL DATA & Types (ต้องคัดลอกมาจาก schedule-meeting.tsx) -------------------

interface ScheduleItem {
    id: number;
    type: 'Holiday' | 'Service' | 'Task' | string;
    typeName?: string;
    name: string;
    start: string; // ISO 8601 string (e.g., "2025-03-25T17:00:00.000Z")
    end: string;   // ISO 8601 string
    color: string;
    allDay: boolean;
    assignee_firstname: (string | null)[] | string | null;
    department_name: string | null;
    license_plate: string | null;
}

// *** IMPORTANT: คัดลอกข้อมูล REAL_SCHEDULE_DATA ที่สมบูรณ์มาจากไฟล์ schedule-meeting.tsx ***
const REAL_SCHEDULE_DATA: ScheduleItem[] = [
    {
        "id": 1,
        "type": "Holiday",
        "typeName": "วันหยุดตามกฏหมาย",
        "name": "วันเข้าพรรษา",
        "start": "2025-01-03",
        "end": "2025-01-03",
        "color": "#FF3F3F",
        "allDay": true,
        "assignee_firstname": "",
        "department_name": "",
        "license_plate": ""
    },
    {
        "id": 3,
        "type": "Holiday",
        "typeName": "วันหยุดบริษัท",
        "name": "วันพระ",
        "start": "2025-02-28",
        "end": "2025-02-28",
        "color": "#FF3F3F",
        "allDay": true,
        "assignee_firstname": "",
        "department_name": "",
        "license_plate": ""
    },
    // .....
    {
        "id": 140,
        "type": "Service",
        "name": "ซ่อมประตูบ้าน",
        "start": "2025-12-29T08:00:00.000Z",
        "end": "2025-12-29T09:00:00.000Z",
        "color": "#77a717ff",
        "allDay": false,
        "assignee_firstname": [
            "กรต"
        ],
        "department_name": "ฝ่ายออกแบบ",
        "license_plate": null
    },
    {
        "id": 141,
        "type": "Service",
        "name": "ddd",
        "start": "2025-12-04T01:00:00.000Z",
        "end": "2025-12-04T11:00:00.000Z",
        "color": "#c7afaf",
        "allDay": false,
        "assignee_firstname": [
            "วีระศักดิ์"
        ],
        "department_name": "ฝ่าย IT Supprot",
        "license_plate": null
    },
    {
        "id": 142, // กิจกรรม piriwat วันที่ 5
        "type": "Service",
        "name": "ประชุมกับพี่วัต",
        "start": "2025-12-08T01:00:00.000Z",
        "end": "2025-12-08T04:00:00.000Z",
        "color": "#c7afaf",
        "allDay": false,
        "assignee_firstname": [
            "piriwat"
        ],
        "department_name": "ฝ่าย IT Supprot",
        "license_plate": null
    }
];
// ------------------- END REAL DATA & Types -------------------


// ------------------- Logic for Time Slot Calculation (NEW) -------------------

// สถานะใหม่: เหลือแค่ ALL_AVAILABLE และ NONE_AVAILABLE
interface CombinedTimeSlot {
    time: string; // HH:MM
    status: 'ALL_AVAILABLE' | 'NONE_AVAILABLE';
}

/**
 * ฟังก์ชันช่วยแปลง ISO 8601 UTC string เป็น Local Date (GMT+7)
 */
const getLocalDateFromISO = (iso: any) => {
    const [datePart, timePart] = iso.split("T");
    const [y, m, d] = datePart.split("-");
    const [hh, mm, ss] = timePart.replace("Z", "").split(":");

    return new Date(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm), Number(ss));
};

/**
 * ฟังก์ชันหลักในการคำนวณช่วงเวลาว่าง 1 ชั่วโมง (8:00 - 18:00)
 */
const getCombinedTimeSlotsFromRealData = (
    dateString: string,
    participants: string[],
    scheduleData: ScheduleItem[]
): CombinedTimeSlot[] => {

    const allSlots: CombinedTimeSlot[] = [];
    const startTimeHour = 8;
    const endTimeHour = 18; // สิ้นสุดที่ 18:00 (แต่ Slot สุดท้ายคือ 17:00 - 18:00)

    // Check for participants
    if (participants.length === 0) return [];

    // สร้าง Time Slot 1 ชั่วโมง (8:00, 9:00, ..., 17:00)
    for (let h = startTimeHour; h < endTimeHour; h++) {
        const slotTimeStart = `${h.toString().padStart(2, '0')}:00`;
        const slotTimeEnd = `${(h + 1).toString().padStart(2, '0')}:00`;

        // แปลงเวลาเริ่มต้น/สิ้นสุดของ Slot 1 ชั่วโมง เป็น Date Object (Local Time)
        const dateObj = new Date(dateString); // วันที่ที่เลือก (YYYY-MM-DD)
        const slotStartDateTime = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), h, 0, 0);
        const slotEndDateTime = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate(), h + 1, 0, 0);

        let busyCount = 0;

        // 1. ตรวจสอบว่าผู้เข้าร่วมแต่ละคนว่างใน Slot นี้หรือไม่
        participants.forEach(participant => {
            const participantBusy = scheduleData.some(item => {
                // กรองเฉพาะงานที่เกี่ยวข้องกับผู้เข้าร่วมนี้ (รวมถึง Holiday ที่ถือว่าทุกคนไม่ว่าง)
                if (item.type !== 'Holiday' && (!item.assignee_firstname || !item.assignee_firstname.includes(participant))) {
                    return false;
                }

                let itemStart: Date;
                let itemEnd: Date;

                if (item.allDay) {
                    // All Day Events: ถ้าวันเริ่มต้นของกิจกรรมตรงกับวันที่เลือก ถือว่าไม่ว่าง
                    const itemDateString = item.start.substring(0, 10);
                    if (itemDateString === dateString) {
                        return true; // ไม่ว่างทั้งวัน
                    }
                    return false;
                } else {
                    // Non-All Day Events: ต้องแปลง UTC -> Local Time (GMT+7)
                    itemStart = getLocalDateFromISO(item.start);
                    itemEnd = getLocalDateFromISO(item.end);

                    // Check Overlap: [slotStartDateTime, slotEndDateTime) ทับซ้อนกับ [itemStart, itemEnd)
                    const isOverlap = slotStartDateTime < itemEnd && slotEndDateTime > itemStart;

                    return isOverlap;
                }
            });

            if (participantBusy) {
                busyCount++;
            }
        });

        // 2. กำหนดสถานะของ Slot 1 ชั่วโมง (เหลือแค่ ALL_AVAILABLE และ NONE_AVAILABLE)
        let status: CombinedTimeSlot['status'];
        if (busyCount === 0) {
            status = 'ALL_AVAILABLE';
        } else {
            // ถ้ามีคนว่างไม่ครบ ถือว่า 'NONE_AVAILABLE' สำหรับการนัดหมายที่ต้องการทุกคนว่างตรงกัน
            status = 'NONE_AVAILABLE';
        }

        allSlots.push({
            time: slotTimeStart, // ใช้เวลาเริ่มต้นของ Slot (เช่น 08:00)
            status: status,
        });
    }

    return allSlots;
};

// ------------------- TimeSlotButtonPicker Component (NEW) -------------------

interface TimeSlotButtonPickerProps {
    timeSlots: CombinedTimeSlot[];
    onSelectRange: (range: { start: string, end: string } | null) => void;
}

const TimeSlotButtonPicker = ({ timeSlots, onSelectRange }: TimeSlotButtonPickerProps) => {
    // ... (State และ Logic การจัดการ Selected Indices และ Multi-Select Start คงเดิม)
    const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
    const [multiSelectStart, setMultiSelectStart] = useState<number | null>(null);

    // ... (ฟังก์ชัน handleSlotClick คงเดิม)
    const handleSlotClick = (index: number) => {
        const slotStatus = timeSlots[index].status;

        if (slotStatus === 'NONE_AVAILABLE') {
            setSelectedIndices([]);
            setMultiSelectStart(null);
            onSelectRange(null);
            return;
        }

        if (multiSelectStart !== null) {
            const startIdx = Math.min(multiSelectStart, index);
            const endIdx = Math.max(multiSelectStart, index);

            let newSelection: number[] = [];
            let isValidRange = true;

            for (let i = startIdx; i <= endIdx; i++) {
                if (timeSlots[i].status === 'NONE_AVAILABLE') {
                    isValidRange = false;
                    break;
                }
                newSelection.push(i);
            }

            if (isValidRange) {
                setSelectedIndices(newSelection);

                const startTime = timeSlots[startIdx].time;
                const endHour = (endIdx + 8) + 1;
                const finalEndTime = `${endHour.toString().padStart(2, '0')}:00`;

                onSelectRange({ start: startTime, end: finalEndTime });

            } else {
                setSelectedIndices([index]);
                const startTime = timeSlots[index].time;
                const endHour = (index + 8) + 1;
                const finalEndTime = `${endHour.toString().padStart(2, '0')}:00`;
                onSelectRange({ start: startTime, end: finalEndTime });
            }

            setMultiSelectStart(null);

        } else {
            if (selectedIndices.includes(index) && selectedIndices.length === 1) {
                setSelectedIndices([]);
                onSelectRange(null);
            } else {
                setSelectedIndices([index]);
                setMultiSelectStart(index);

                const startTime = timeSlots[index].time;
                const endHour = (index + 8) + 1;
                const finalEndTime = `${endHour.toString().padStart(2, '0')}:00`;
                onSelectRange({ start: startTime, end: finalEndTime });
            }
        }
    };


    // ฟังก์ชันสร้างปุ่มที่ถูกปรับปรุงให้ Compact และ Rounded Full
    const renderTimeButtons = (startIndex: number, endIndex: number) => {
        const buttons = [];
        for (let index = startIndex; index <= endIndex; index++) {
            const slot = timeSlots[index];
            const isSelected = selectedIndices.includes(index);
            const isAvailable = slot.status === 'ALL_AVAILABLE';
            const isMultiStart = multiSelectStart === index;

            const startHour = parseInt(slot.time.split(':')[0]);
            const endTime = `${(startHour + 1).toString().padStart(2, '0')}:00`;
            const displayTime = `${slot.time.substring(0, 5)}`;

            let bgColor = "white";
            let textColor = "gray.700";
            let borderColor = "gray.200";
            let hoverBgColor = "gray.50";
            let hoverBorderColor = "blue.500";
            let cursor = 'not-allowed';
            let boxShadow = "md"; // เริ่มต้นด้วย md

            if (isAvailable) {
                cursor = 'pointer';
                borderColor = "green.300";

                if (isSelected) {
                    // สถานะ 'เลือกแล้ว' (Solid Blue)
                    bgColor = "blue.600";
                    textColor = "white";
                    borderColor = "blue.600";
                    boxShadow = "xl";
                    hoverBgColor = "blue.700";
                    hoverBorderColor = "blue.700";
                } else if (isMultiStart) {
                    // สถานะ 'จุดเริ่มต้นเลือก' (Outline Blue)
                    bgColor = "white";
                    textColor = "blue.600";
                    borderColor = "blue.500";
                } else {
                    // สถานะ 'ว่าง' (Outline Green)
                    bgColor = "white";
                    textColor = "green.700";
                    borderColor = "green.500";
                    hoverBgColor = "green.100";
                }

            } else {
                // สถานะ 'ไม่ว่าง' (Solid Red/Gray)
                bgColor = "red.500";
                textColor = "white";
                borderColor = "red.500";
                boxShadow = "none";
                hoverBgColor = "red.500";
            }

            // ถ้าไม่ว่างและไม่ได้ถูกเลือก (Disbled State)
            if (!isAvailable && !isSelected) {
                bgColor = "gray.300";
                textColor = "gray.600";
                borderColor = "gray.400";
                boxShadow = "sm";
            }


            buttons.push(
                <Box
                    key={index}
                    // --- Style ที่ต้องการจาก Navigation Box ---
                    p={0}
                    bg={bgColor}
                    borderRadius="md"
                    boxShadow={boxShadow}
                    borderColor={borderColor}
                    borderWidth="1px"
                    textAlign="center"
                    padding="2" // ปรับให้กระชับกว่า padding="4"
                    rounded="full"
                    transition="all 0.3s ease"
                    cursor={cursor}

                    // --- Attributes การทำงาน ---
                    onClick={isAvailable ? () => handleSlotClick(index) : undefined}
                    h="50px" // ปรับความสูงเล็กน้อย
                    w="full"

                    // --- Hover Effect ---
                    _hover={isAvailable ? {
                        borderColor: hoverBorderColor,
                        boxShadow: "0 4px 15px 0 rgba(59, 130, 246, 0.3)", // ใช้ Blue Shadow ให้ดูโดดเด่น
                        transform: "translateY(-1px)",
                        bg: hoverBgColor,
                        color: textColor === "white" ? "white" : "green.700" // คงสีตัวอักษรไว้
                    } : {}}

                    opacity={!isAvailable && !isSelected ? 0.7 : 1} // หรี่แสงเมื่อไม่ว่าง
                    userSelect="none"
                >
                    <VStack spacing={0} align="center" color={textColor} justify="center" h="full">
                        <Text fontSize="16px" fontWeight="bold" lineHeight="normal">
                            {displayTime}
                        </Text>
                        <Text fontSize="16px" lineHeight="normal" display={{ base: 'none', md: 'block' }}>
                            {isAvailable ? 'ว่าง' : 'ไม่ว่าง'}
                        </Text>
                    </VStack>
                </Box>
            );
        }
        return buttons;
    };

    return (
        <VStack spacing={6} align="stretch" w="full">
            {/* 1. Time Buttons Container (แบ่งเป็น 2 แถว) */}
            <VStack
                spacing={4}
                p={4}
                bg="gray.50"
                borderRadius="lg"
                boxShadow="inner"
            >
                {/* 1.1 แถวเช้า (8:00 - 13:00) -> Index 0 ถึง 4 (5 Slots) */}
                <Box w="full">
                    <Text mb={2} fontWeight="bold" color="gray.700"></Text>
                    <Grid templateColumns="repeat(5, 1fr)" gap={2}>
                        {renderTimeButtons(0, 4)}
                    </Grid>
                </Box>

                {/* 1.2 แถวบ่าย (13:00 - 18:00) -> Index 5 ถึง 9 (5 Slots) */}
                <Box w="full">
                    <Text mb={2} fontWeight="bold" color="gray.700"></Text>
                    <Grid templateColumns="repeat(5, 1fr)" gap={2}>
                        {renderTimeButtons(5, 9)}
                    </Grid>
                </Box>
            </VStack>

            {/* 2. Display Selection Hint */}
            <Center pt={2}>
                <Text color="gray.500" fontSize="sm">
                    {multiSelectStart !== null
                        ? 'คลิกปุ่มที่สองเพื่อสิ้นสุดช่วงเวลา หรือคลิกปุ่มเดิมเพื่อยกเลิก'
                        : 'คลิกปุ่มแรกเพื่อเริ่มต้นเลือกช่วงเวลา'
                    }
                </Text>
            </Center>

            {/* 3. Legend (คงเดิม) */}
            <HStack justify="center" spacing={6} mt={2}>
                <HStack>
                    <CheckCircleIcon color="green.500" />
                    <Text fontSize="sm">ว่างตรงกัน (เลือกได้)</Text>
                </HStack>
                <HStack>
                    <CloseIcon color="red.500" w={3} h={3} />
                    <Text fontSize="sm">ไม่ว่าง (เลือกไม่ได้)</Text>
                </HStack>
                <HStack>
                    <Box w="10px" h="10px" bg="blue.500" borderRadius="full" />
                    <Text fontSize="sm">ช่วงที่เลือก</Text>
                </HStack>
            </HStack>
        </VStack>
    );
};

// ------------------- SelectTime Component -------------------

export default function SelectTime() {
    const router = useRouter();
    const toast = useToast();
    const { date: dateString, participants: participantsString } = router.query;
    const [selectedRange, setSelectedRange] = useState<{ start: string, end: string } | null>(null);
    const [isConfirming, setIsConfirming] = useState(false);
    // Check for missing data
    if (!dateString || !participantsString) {
        return (
            <Center h="100vh">
                <Text>Missing schedule data. Please go back and select a date.</Text>
                <Button onClick={() => router.push('/schedule-meeting')}>Go to Schedule</Button>
            </Center>
        );
    }

    const handleSelectRange = (range: { start: string, end: string } | null) => {
        setSelectedRange(range);
    };

    const selectedDate = new Date(dateString as string);
    const selectedParticipants = (participantsString as string).split(',');
    const formattedDate = selectedDate.toLocaleDateString('th-TH', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    // 🚨 ใช้ฟังก์ชันคำนวณจาก Data จริง
    const timeSlots = useMemo(() => {
        return getCombinedTimeSlotsFromRealData(dateString as string, selectedParticipants, REAL_SCHEDULE_DATA);
    }, [dateString, participantsString]);

    const handleConfirmBooking = () => {
        if (!selectedRange) {
            toast({
                title: "Error",
                description: "Please select a time range first.",
                status: "warning",
                duration: 3000,
                isClosable: true,
                // 🚨 ปรับตำแหน่งเป็นด้านบน
                position: "top",
            });
            return;
        }

        toast({
            title: "นัดหมายสำเร็จ!",
            description: `การประชุมถูกกำหนดในวันที่ ${formattedDate} เวลา ${selectedRange.start} ถึง ${selectedRange.end}`,
            status: "success",
            duration: 7000,
            isClosable: true,
            position: "top",
        });
        setIsConfirming(true);
        setTimeout(() => {
            router.push('/schedule-meeting');
        }, 1000);
        // Note: ใน Production, คุณควรส่ง request ไปบันทึกการนัดหมายที่นี่
    };

    const handleGoBack = () => {
        router.back();
    };


    return (
        <Box>
            <Navbar />

            {/* --- Navigation Grid --- */}
            <Grid
                templateColumns={{ base: "auto", md: "auto auto" }}
                gap={4}
                mt={4}
                px={4}
                position="absolute"
                zIndex={1}
            >
                {/* Item 1: กลับสู่หน้าแรก */}
                <Box
                    p={0} bg="white" borderRadius="md" boxShadow="md" borderColor="gray.200" borderWidth="1px" textAlign="center" padding="4" rounded="full" transition="all 0.3s ease" cursor="pointer" onClick={() => router.push("/")}
                    _hover={{ borderColor: "blue.500", boxShadow: "0 4px 20px 0 rgba(59, 130, 246, 0.4)", transform: "translateY(-1px)" }}> <Text>กลับสู่หน้าแรก</Text> </Box>
                {/* Item 2: Schedule Meeting */}
                <Box
                    gridColumn={{ base: "auto", md: "1 / span 2" }} p={0} bg="white" borderRadius="md" boxShadow="md" borderColor="gray.200" borderWidth="1px" textAlign="center" padding="4" rounded="full" transition="all 0.3s ease" cursor="pointer" onClick={() => router.push("/schedule-meeting")}
                    _hover={{ borderColor: "blue.500", boxShadow: "0 4px 20px 0 rgba(59, 130, 246, 0.4)", transform: "translateY(-1px)" }}> <Text>Schedule Meeting</Text> </Box>
            </Grid>

            <Center minH="calc(100vh - 64px)" bg="gray.50" p={4}>
                <Box
                    bg="white"
                    p={{ base: 4, md: 8 }}
                    borderRadius="lg"
                    boxShadow="xl"
                    maxW="900px"
                    w="full"
                >
                    <VStack spacing={6} align="stretch">

                        {/* Header และปุ่มย้อนกลับ/เลือกวันอื่น */}
                        <HStack justify="space-between" align="flex-start">
                            <IconButton
                                aria-label="Go Back"
                                icon={<ArrowBackIcon />}
                                size="lg"
                                variant="ghost"
                                onClick={handleGoBack}
                            />
                            <VStack align="center" spacing={0}>
                                <Heading as="h3" size="lg" color="blue.600">
                                    <TimeIcon mr={2} /> เลือกช่วงเวลาที่ว่าง
                                </Heading>
                                <Text fontSize="xl" color="gray.700" fontWeight="bold" mt={1}>
                                    {formattedDate}
                                </Text>
                                <HStack wrap="wrap" mt={2} justify="center">
                                    <Text fontSize="sm" color="gray.500">ผู้เข้าร่วม:</Text>
                                    {selectedParticipants.map(p => (
                                        <Badge key={p} colorScheme="blue" variant="solid">{p.split('@')[0]}</Badge>
                                    ))}
                                </HStack>
                            </VStack>
                            <Button
                                size="sm"
                                leftIcon={<RepeatIcon />}
                                onClick={handleGoBack}
                            >
                                เลือกวันอื่น
                            </Button>
                        </HStack>

                        <Divider />

                        <Text fontSize="md" color="gray.600" align="center" fontWeight="semibold">
                            เลือกช่วงเวลา 1 ชั่วโมง (8:00 - 18:00) ที่ทุกคนว่างตรงกัน
                        </Text>

                        {/* --- Button Time Picker (NEW) --- */}
                        <TimeSlotButtonPicker
                            timeSlots={timeSlots}
                            onSelectRange={handleSelectRange}
                        />
                        {/* --- END Button Time Picker --- */}

                        <Divider />

                        {/* ปุ่มยืนยันการจอง */}
                        <Center>
                            <Button
                                size="lg"
                                bgGradient="linear(to-r, blue.800, purple.600)"
                                transition="all 0.3s ease"
                                _hover={{ bgGradient: "linear(to-r, blue.600, purple.400)" }}
                                color="white"
                                mt={4}
                                isDisabled={!selectedRange || isConfirming}
                                onClick={handleConfirmBooking}
                            >
                                ยืนยันการนัดหมาย: {selectedRange ? `${selectedRange.start} - ${selectedRange.end}` : 'กรุณาเลือกเวลา'}
                            </Button>
                        </Center>

                    </VStack>
                </Box>
            </Center>
        </Box>
    );
}