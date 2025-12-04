// pages/schedule-meeting.tsx

import {
  Box,
  Button,
  Center,
  VStack,
  Heading,
  Text,
  Flex,
  Input,
  IconButton,
  Grid,
  Badge,
  CloseButton,
  HStack,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverBody,
  Stack,
} from "@chakra-ui/react";
import Navbar from "../components/Navbar";
// ใช้ WarningIcon สำหรับสถานะว่างทุกคน/ว่างบางส่วน
import { AddIcon, ChevronLeftIcon, ChevronRightIcon, WarningIcon, CloseIcon, TimeIcon, CalendarIcon } from "@chakra-ui/icons";
import { useState, useMemo, useRef } from "react";
import { HamburgerIcon } from "@chakra-ui/icons";
import { useRouter } from "next/router";
import { REAL_SCHEDULE_DATA, ScheduleItem } from "../utils/mockData";

// ------------------- TypeScript Types and Real Data -------------------

// Interface สำหรับข้อมูล Schedule List จริง

// ข้อมูล Schedule List จริง (อัปเดตจากผู้ใช้)

// MOCK: รายชื่อผู้เข้าร่วมที่เป็นไปได้
const MOCK_ALL_PARTICIPANTS = [
  'piriwat',
  'partner1',
  'partner2',
  'ทักษ์ดนัย',
  'สัมฤทธิ์',
  'มารุต',
  'Test',
  'วีระศักดิ์',
  'กรต',
];
// MOCK: ตั้งต้นที่ piriwat เพื่อทดสอบสถานะ Partial
const MOCK_SELECTED_PARTICIPANTS = ['piriwat'];

type DayStatus = 'ALL_AVAILABLE' | 'PARTIAL_AVAILABLE' | 'NONE_AVAILABLE' | 'DEFAULT' | string;

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];
const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const TODAY = new Date(2025, 11, 3, 0, 0, 0, 0); // 3 ธ.ค. 2025 

// ------------------- Calendar Logic Functions (Unchanged) -------------------

/**
 * ฟังก์ชันช่วยแปลง ISO 8601 UTC string เป็น Local Date (GMT+7)
 */
const getLocalDateFromISO = (isoString: string): Date => {
  return new Date(isoString);
};

/**
 * คำนวณสถานะความว่างของวันนั้นๆ สำหรับผู้เข้าร่วมที่เลือกทั้งหมด
 */
const getConsolidatedAvailability = (date: Date, selectedParticipants: string[], scheduleData: ScheduleItem[]) => {
  const dateString =
    date.getFullYear() + "-" +
    String(date.getMonth() + 1).padStart(2, '0') + "-" +
    String(date.getDate()).padStart(2, '0');

  if (selectedParticipants.length === 0) {
    return { status: 'DEFAULT', events: [] };
  }

  const relevantEvents: ScheduleItem[] = [];
  let hasFullDayBusy = false;   // <— สำคัญที่สุด
  let hasPartialBusy = false;

  scheduleData.forEach(item => {
    const eventDate = new Date(item.start);
    const itemDateString =
      eventDate.getFullYear() + "-" +
      String(eventDate.getMonth() + 1).padStart(2, '0') + "-" +
      String(eventDate.getDate()).padStart(2, '0');
    const isSameDay = itemDateString === dateString;

    if (!isSameDay) return;

    selectedParticipants.forEach(participant => {
      const matched =
        item.type === 'Holiday' ||
        (item.assignee_firstname &&
          (Array.isArray(item.assignee_firstname)
            ? item.assignee_firstname.includes(participant)
            : item.assignee_firstname === participant));

      if (!matched) return;

      // เก็บ event ไว้โชว์ใน hover card
      if (!relevantEvents.some(e => e.id === item.id)) {
        relevantEvents.push(item);
      }

      // All-day event → บล็อกทั้งวัน
      if (item.allDay || item.type === 'Holiday') {
        hasFullDayBusy = true;
      } else {
        // ⭐ ตรวจสอบว่าไม่ว่างเกือบทั้งวัน (เช่น 08:00–18:00)
        const start = new Date(item.start);
        const end = new Date(item.end);

        const startHour = start.getHours();
        const endHour = end.getHours();

        // กำหนดว่า "ช่วงทำงานหลัก" คือ 08:00 - 18:00
        const WORK_START = 8;
        const WORK_END = 18;

        // ถ้าเหตุการณ์กินเวลาครอบช่วงหลัก → ถือว่าไม่ว่างทั้งวัน
        const coversWholeWorkday =
          startHour <= WORK_START && endHour >= WORK_END;

        if (coversWholeWorkday) {
          hasFullDayBusy = true;  // 🔥 กลายเป็นสีแดงทั้งวัน
        } else {
          hasPartialBusy = true;
        }
      }

    });
  });

  // 🔥 สรุปสถานะ
  let status: DayStatus = 'ALL_AVAILABLE';

  if (hasFullDayBusy) {
    status = 'NONE_AVAILABLE';
  } else if (hasPartialBusy) {
    status = 'PARTIAL_AVAILABLE';
  }

  return { status, events: relevantEvents };
};



// ------------------- DayHoverCard Component (Unchanged) -------------------

interface DayHoverCardProps {
  date: Date;
  events: ScheduleItem[];
  selectedParticipants: string[];
}

const formatLocalTime = (iso: string) => {
  const d = new Date(iso);
  return d.toLocaleTimeString("th-TH", { hour: "2-digit", minute: "2-digit" });
};

const DayHoverCard = ({ date, events, selectedParticipants }: DayHoverCardProps) => {
  const formattedDate = date.toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long' });

  if (events.length === 0) {
    return (
      <Text fontSize="sm" color="gray.500">
        🥳 ว่างทั้งวัน! ไม่มีกิจกรรมที่ต้องทำร่วมกัน.
      </Text>
    );
  }

  // ผู้ที่มี event บางช่วงในวันนั้น
  const partialBusy: string[] = [];

  // ผู้ที่ไม่ว่างทั้งวัน (all-day หรือ holiday)
  const fullDayBusy: string[] = [];

  events.forEach(event => {
    // Holiday → ไม่ว่างทั้งวัน
    if (event.type === "Holiday" || event.allDay) {
      selectedParticipants.forEach(p => {
        if (!fullDayBusy.includes(p)) fullDayBusy.push(p);
      });
      return;
    }

    // ไม่ใช่ all-day → เช็คว่ามี assignment เป็นบางช่วง
    if (event.assignee_firstname) {
      const assignees = Array.isArray(event.assignee_firstname)
        ? event.assignee_firstname
        : [event.assignee_firstname];

      assignees.filter((p: any) => selectedParticipants.includes(p)).forEach((p: any) => {
        if (!partialBusy.includes(p)) partialBusy.push(p);
      });
    }
  });

  // คนที่ไม่ว่าง = full-day + partial
  const busyParticipants = [...new Set([...fullDayBusy, ...partialBusy])];


  const availableParticipants = selectedParticipants.filter(p => !busyParticipants.includes(p));

  // สร้าง map
  const busyTimeline = busyParticipants.map(person => {
    const personEvents = events.filter(ev =>
      ev.type === "Holiday"
        ? true // holiday = ไม่ว่างทั้งวัน
        : Array.isArray(ev.assignee_firstname)
          ? ev.assignee_firstname.includes(person)
          : ev.assignee_firstname === person
    );

    // Holiday ก็เป็นทั้งวัน
    const ranges = personEvents.map(ev => {
      if (ev.allDay || ev.type === "Holiday") {
        return "ทั้งวัน";
      }
      return `${formatLocalTime(ev.start)} - ${formatLocalTime(ev.end)}`;
    });

    return {
      person,
      ranges
    };
  });

  return (
    <VStack align="stretch" spacing={2} maxW="300px">
      <Text fontWeight="bold" fontSize="md" color="blue.600">
        <CalendarIcon mr={2} /> ภารกิจ/กิจกรรมวันที่ {formattedDate}
      </Text>

      {/* สรุปสถานะ */}
      {/* <Box p={2} bg="blue.50" borderRadius="md">
        <Text fontSize="sm" fontWeight="semibold" mb={1}>
          สถานะโดยรวม:
        </Text>
        <Badge colorScheme={availableParticipants.length === selectedParticipants.length ? "green" : availableParticipants.length > 0 ? "orange" : "red"}>
          {availableParticipants.length === selectedParticipants.length ? "ว่างทุกคน" : availableParticipants.length > 0 ? "ว่างบางส่วน" : "ไม่ว่างเลย"}
        </Badge>
        {busyParticipants.length > 0 && (
          <Text fontSize="xs" color="gray.700" mt={1}>
            ไม่ว่าง: **{busyParticipants.join(', ')}**
          </Text>
        )}
      </Box> */}

      {/* รายละเอียดกิจกรรม */}
      <Text fontSize="sm" fontWeight="semibold" mt={2}>
        รายละเอียดกิจกรรม:
        {/* แสดงว่าใครไม่ว่างช่วงไหน */}
      </Text>
      {busyTimeline.length > 0 && (
        <>
          <Text fontSize="sm" fontWeight="semibold" mt={3}>
            ตารางเวลาไม่ว่าง:
          </Text>

          {busyTimeline.map((item, i) => (
            <Box key={i} p={2} bg="yellow.50" borderRadius="md" borderLeft="3px solid #f6ad55" mt={1}>
              <Text fontWeight="semibold" fontSize="sm">
                {item.person}
              </Text>
              {item.ranges.map((rg, j) => (
                <Text key={j} fontSize="xs" color="gray.700">
                  {rg}
                </Text>
              ))}
            </Box>
          ))}
        </>
      )}
      {events.map((event, index) => (
        <Box
          key={index}
          p={2}
          bg="white"
          borderRadius="md"
          borderLeft="3px solid"
          borderColor={event.color || 'gray.400'}
          boxShadow="sm"
        >
          <HStack spacing={2} align="flex-start">
            <TimeIcon color="gray.600" mt={1} />
            <VStack align="flex-start" spacing={0}>
              <Text fontWeight="semibold" fontSize="sm" lineHeight="shorter">
                {event.name}
              </Text>
              <Text fontSize="xs" color="gray.600" lineHeight="shorter">
                {event.allDay ? (
                  <Badge colorScheme="red" size="sm">All Day ({event.type})</Badge>
                ) : (
                  `Assigned to: ${Array.isArray(event.assignee_firstname) ? event.assignee_firstname.filter(Boolean).join(', ') : event.assignee_firstname}`
                )}
              </Text>
            </VStack>
          </HStack>
        </Box>
      ))}
    </VStack>
  );
};


// ------------------- CalendarDayBox Component (Updated Colors/Icons) -------------------

interface CalendarDayBoxProps {
  date: Date;
  status: DayStatus;
  events: ScheduleItem[];
  isCurrentMonth: boolean;
  isToday: boolean;
  isPast: boolean;
  onDayClick: (date: Date) => void;
  selectedParticipants: string[];
}

const CalendarDayBox = ({ date, status, events, isCurrentMonth, isToday, isPast, onDayClick, selectedParticipants }: CalendarDayBoxProps) => {
  const day = date.getDate();
  const boxRef = useRef(null);

  const isWeekend = date.getDay() === 0 || date.getDay() === 6; // เช็คเสาร์-อาทิตย์

  let bgColor = isCurrentMonth ? "white" : "gray.50";
  let textColor = isCurrentMonth ? "gray.800" : "gray.400";
  let icon = null;

  if (isToday) {
    bgColor = "blue.100";
    textColor = "blue.800";
  } else if (isPast && isCurrentMonth) {
    textColor = "red.400";
  } else if (isCurrentMonth && !isPast) {
    if (status === 'ALL_AVAILABLE') {
      bgColor = "green.100";
      textColor = "green.800";
      icon = <WarningIcon w={3} h={3} ml={1} color="green.600" />;
    } else if (status === 'PARTIAL_AVAILABLE') {
      bgColor = "green.100";
      textColor = "green.800";
      icon = <WarningIcon w={3} h={3} ml={1} color="green.600" />;
    } else if (status === 'NONE_AVAILABLE') {
      bgColor = "red.100";
      textColor = "red.800";
      icon = <CloseIcon w={3} h={3} ml={1} color="red.600" />;
    }
  }

  // ✅ ปรับให้เสาร์-อาทิตย์ไม่สามารถเลือกได้
  const isSelectable = isCurrentMonth && !isPast && status !== 'NONE_AVAILABLE' && !isWeekend;
  const cursor = isSelectable ? "pointer" : "default";
  const hoverBgColor = isSelectable
    ? (status === 'ALL_AVAILABLE' ? "green.200" : "green.200")
    : undefined;

  // หากเป็น weekend → ไม่แสดง Popover เลย
  if (isWeekend) {
    return (
      <Center
        ref={boxRef}
        h={{ base: "40px", md: "50px" }}
        border="1px"
        borderColor="gray.200"
        fontSize={{ base: "sm", md: "md" }}
        bg={bgColor}
        color={textColor}
        fontWeight={isToday ? "bold" : "normal"}
        opacity={0.6}
        userSelect="none"
      >
        {day}
      </Center>
    );
  }

  return (
    <Popover trigger="hover" placement="top-start" openDelay={200}>
      <PopoverTrigger>
        <Center
          ref={boxRef}
          h={{ base: "40px", md: "50px" }}
          border="1px"
          borderColor="gray.200"
          fontSize={{ base: "sm", md: "md" }}
          cursor={cursor}
          bg={bgColor}
          color={textColor}
          _hover={{
            bg: hoverBgColor,
            zIndex: 1
          }}
          onClick={isSelectable ? () => onDayClick(date) : undefined}
          fontWeight={isToday ? "bold" : "normal"}
          opacity={isPast && isCurrentMonth ? 0.7 : 1}
          userSelect="none"
          position="relative"
        >
          <Flex align="center">
            {day}
            {icon}
          </Flex>
        </Center>
      </PopoverTrigger>

      <PopoverContent zIndex={9999} maxW="320px" boxShadow="xl">
        <PopoverBody p={3}>
          <DayHoverCard date={date} events={events} selectedParticipants={selectedParticipants} />
        </PopoverBody>
      </PopoverContent>
    </Popover>
  );
};


// ------------------- ParticipantBadge Component (Unchanged) -------------------

interface ParticipantBadgeProps {
  email: string;
  onRemove: (email: string) => void;
}

const ParticipantBadge = ({ email, onRemove }: ParticipantBadgeProps) => {
  const displayLabel = email;

  return (
    <Badge
      variant="solid"
      colorScheme="blue"
      fontSize="sm"
      px={2}
      py={1}
      borderRadius="full"
      mr={2}
      mb={1}
      mt={1}
    >
      <HStack spacing={1}>
        <Text>{displayLabel}</Text>
        <CloseButton
          size="sm"
          onClick={() => onRemove(email)}
          _hover={{ bg: 'blue.600' }}
          color="white"
        />
      </HStack>
    </Badge>
  );
};


// ------------------- ScheduleMeeting Component -------------------

export default function ScheduleMeeting() {
  const router = useRouter();
  const [currentDate, setCurrentDate] = useState(new Date(TODAY.getFullYear(), TODAY.getMonth()));
  const [selectedParticipants, setSelectedParticipants] = useState(MOCK_SELECTED_PARTICIPANTS);
  const [searchTerm, setSearchTerm] = useState('');

  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth(); // 0-11

  const handleDayClick = (date: Date) => {
    if (selectedParticipants.length === 0) {
      alert("Please select at least one participant first.");
      return;
    }

    // Check Status again before navigating
    const { status } = getConsolidatedAvailability(date, selectedParticipants, REAL_SCHEDULE_DATA);
    // หากไม่ว่างเลย ห้ามเลือก
    if (status === 'NONE_AVAILABLE') {
      alert("Cannot select this day. All participants are busy or it is a holiday.");
      return;
    }
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0'); // getMonth() ให้ค่า 0-11
    const day = date.getDate().toString().padStart(2, '0');

    const dateString = `${year}-${month}-${day}`;
    const participantsString = selectedParticipants.join(',');

    router.push({
      pathname: '/select-time',
      query: {
        date: dateString,
        participants: participantsString
      },
    });
  };

  const addParticipant = (email: string) => {
    if (!selectedParticipants.includes(email)) {
      setSelectedParticipants(prev => [...prev, email]);
      setSearchTerm('');
    }
  };

  const availableParticipants = useMemo(() => {
    return MOCK_ALL_PARTICIPANTS.filter(email => !selectedParticipants.includes(email))
      .filter(email => email.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [selectedParticipants, searchTerm]);

  const removeParticipant = (emailToRemove: string) => {
    setSelectedParticipants(prev =>
      prev.filter(email => email !== emailToRemove)
    );
  };


  const changeMonth = (delta: number) => {
    setCurrentDate(prevDate => {
      const newDate = new Date(prevDate.getFullYear(), prevDate.getMonth() + delta, 1);
      return newDate;
    });
  };

  const calendarDays = useMemo(() => {
    const startOfMonth = new Date(currentYear, currentMonth, 1);
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0);
    const numDays = endOfMonth.getDate();
    const startDayOfWeek = startOfMonth.getDay();

    const days = [];

    // 1. เพิ่มวันจากเดือนที่แล้ว
    const prevMonth = new Date(currentYear, currentMonth, 0);
    const daysInPrevMonth = prevMonth.getDate();

    for (let i = startDayOfWeek; i > 0; i--) {
      const date = new Date(currentYear, currentMonth - 1, daysInPrevMonth - i + 1);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isPast: date < TODAY,
        status: 'DEFAULT' as DayStatus,
        events: [] as ScheduleItem[],
      });
    }

    // 2. เพิ่มวันของเดือนปัจจุบัน
    for (let day = 1; day <= numDays; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const isToday = date.toDateString() === TODAY.toDateString();

      const isWeekend = date.getDay() === 6 || date.getDay() === 0;
      const isCurrentMonth = date.getMonth() === currentMonth;

      const isPast = (date < TODAY && isCurrentMonth) || isWeekend;

      const { status, events } = getConsolidatedAvailability(date, selectedParticipants, REAL_SCHEDULE_DATA);

      days.push({
        date,
        isCurrentMonth: true,
        isToday,
        isPast,
        status,
        events,
      });
    }

    // 3. เพิ่มวันจากเดือนถัดไป
    for (let day = 1; days.length < 42; day++) {
      const date = new Date(currentYear, currentMonth + 1, day);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
        isPast: false,
        status: 'DEFAULT' as DayStatus,
        events: [] as ScheduleItem[],
      });
    }

    return days;
  }, [currentDate, selectedParticipants]);


  return (
    <Box>
      <Navbar />

      {/* --- Navigation Grid --- */}
      {/* --- Navigation Bar (Responsive) --- */}
      <Box
        mt={4}
        px={4}
        position="absolute"
        zIndex={1}
      >
        {/* 1. Menu สำหรับหน้าจอขนาดเล็ก/กลาง (base ถึง lg) */}
        <Box display={{ base: "block", xl: "none" }}> {/* base ถึง lg ให้แสดง Menu, xl ขึ้นไปให้ซ่อน */}
          <Menu>
            <MenuButton
              as={IconButton}
              aria-label="Options"
              icon={<HamburgerIcon />}
              variant="outline"
              size="lg"
              colorScheme="blue"
              rounded="full"
              boxShadow="md"
              bgColor="white"
            />
            <MenuList zIndex={2}>
              <MenuItem onClick={() => router.push("/")}>
                กลับสู่หน้าแรก
              </MenuItem>
              <MenuItem onClick={() => router.push("/ai-assistant")}>
                AI Assistant
              </MenuItem>
              <MenuItem onClick={() => router.push("/meeting-management")}>
                Meeting Management
              </MenuItem>
            </MenuList>
          </Menu>
        </Box>

        {/* 2. Grid สำหรับหน้าจอขนาดใหญ่ (xl ขึ้นไป) */}
        <Grid
          templateColumns="auto auto"
          gap={4}
          display={{ base: "none", xl: "grid" }} // base ถึง lg ให้ซ่อน, xl ขึ้นไปให้แสดง Grid
        >
          {/* Item 1: กลับสู่หน้าแรก */}
          <Box
            p={0} bg="white" borderRadius="md" boxShadow="md" borderColor="gray.200" borderWidth="1px" textAlign="center" padding="4" rounded="full" transition="all 0.3s ease" cursor="pointer" onClick={() => router.push("/")}
            _hover={{ borderColor: "blue.500", boxShadow: "0 4px 20px 0 rgba(59, 130, 246, 0.4)", transform: "translateY(-1px)" }}> <Text>กลับสู่หน้าแรก</Text> </Box>
          {/* Item 2: AI Assistant */}
          <Box
            p={0} bg="white" borderRadius="md" boxShadow="md" borderColor="gray.200" borderWidth="1px" textAlign="center" padding="4" rounded="full" transition="all 0.3s ease" cursor="pointer" onClick={() => router.push("/ai-assistant")}
            _hover={{ borderColor: "blue.500", boxShadow: "0 4px 20px 0 rgba(59, 130, 246, 0.4)", transform: "translateY(-1px)" }}> <Text>AI Assistant</Text> </Box>
          {/* Item 3: Meeting Management */}
          <Box
            gridColumn="1 / span 2" p={0} bg="white" borderRadius="md" boxShadow="md" borderColor="gray.200" borderWidth="1px" textAlign="center" padding="4" rounded="full" transition="all 0.3s ease" cursor="pointer" onClick={() => router.push("/meeting-management")}
            _hover={{ borderColor: "blue.500", boxShadow: "0 4px 20px 0 rgba(59, 130, 246, 0.4)", transform: "translateY(-1px)" }}> <Text>Meeting Management</Text> </Box>
        </Grid>
      </Box>
      {/* --- END Navigation Bar (Responsive) --- */}

      <Center minH="calc(100vh - 64px)" bg="gray.50" p={4}>
        <Box
          bg="white"
          p={{ base: 4, md: 8 }}
          borderRadius="lg"
          boxShadow="xl"
          maxW="800px"
          w="full"
        >
          <VStack spacing={6} align="stretch">
            <VStack align="flex-start" spacing={1}>
              <Heading as="h3" size="lg" color="blue.600">🗓️ Schedule Meeting</Heading>
              <Text fontSize="sm" color="gray.600">ตรวจสอบตารางงานร่วมกันเพื่อเลือกวันนัดหมายที่สะดวก</Text>
            </VStack>

            {/* --- PARTICIPANT BADGE LIST --- */}
            <Box>
              <Text mb={2} fontSize="sm" fontWeight="semibold">1. ผู้เข้าร่วม (Selected: **{selectedParticipants.length}** people)</Text>

              <Flex
                p={2}
                borderWidth="1px"
                borderColor="gray.200"
                borderRadius="md"
                wrap="wrap"
                align="center"
                minH="40px"
              >
                {/* 1. Badges */}
                {selectedParticipants.map(email => (
                  <ParticipantBadge
                    key={email}
                    email={email}
                    onRemove={removeParticipant}
                  />
                ))}

                {/* 2. Menu สำหรับค้นหาและเพิ่มคน */}
                <Menu matchWidth={true} closeOnSelect={false}>
                  <MenuButton
                    as={IconButton}
                    aria-label="Add Email"
                    icon={<AddIcon w={3} h={3} />}
                    size="sm"
                    colorScheme="blue"
                    variant="outline"
                    ml="auto"
                  />

                  {/* Dropdown Menu List ที่มี Input อยู่ด้านใน */}
                  <MenuList zIndex={2} minW={{ base: "250px", md: "300px" }} maxH="300px" overflowY="auto">
                    <Box px={2} pt={1} pb={2}>
                      <Input
                        placeholder="Search or type name..."
                        size="sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                      />
                    </Box>
                    <MenuDivider mt={0} mb={0} />

                    {availableParticipants.length > 0 ? (
                      availableParticipants.map(email => (
                        <MenuItem
                          key={email}
                          onClick={() => addParticipant(email)}
                        >
                          {email}
                        </MenuItem>
                      ))
                    ) : (
                      <MenuItem
                        isDisabled={true}
                        color={"gray.500"}
                      >
                        {searchTerm ? "No results found." : "All participants selected."}
                      </MenuItem>
                    )}
                  </MenuList>
                </Menu>

              </Flex>
            </Box>
            {/* --- END PARTICIPANT BADGE LIST --- */}

            {/* --- Calendar Component --- */}
            <Box mt={4}>
              <Text mb={2} fontSize="sm" fontWeight="semibold">2. เลือกวันที่สะดวก (Click to select time)</Text>
              <Flex justify="space-between" align="center" mb={2}>
                <Heading as="h4" size="md" color="gray.700">
                  {monthNames[currentMonth]} {currentYear}
                </Heading>
                <Flex>
                  <IconButton
                    aria-label="Previous Month"
                    icon={<ChevronLeftIcon />}
                    size="sm" mr={1} variant="outline"
                    onClick={() => changeMonth(-1)}
                  />
                  <IconButton
                    aria-label="Next Month"
                    icon={<ChevronRightIcon />}
                    size="sm" variant="outline"
                    onClick={() => changeMonth(1)}
                  />
                </Flex>
              </Flex>

              {/* Day Headers */}
              <Grid templateColumns="repeat(7, 1fr)" mb={1}>
                {weekDays.map((day) => (
                  <Center key={day} h="30px" fontWeight="bold" fontSize={{ base: "xs", md: "sm" }} color="gray.600">
                    {day}
                  </Center>
                ))}
              </Grid>

              {/* Calendar Grid */}
              <Grid templateColumns="repeat(7, 1fr)">
                {calendarDays.map((data, index) => (
                  <CalendarDayBox
                    key={index}
                    date={data.date}
                    status={data.status}
                    events={data.events}
                    isCurrentMonth={data.isCurrentMonth}
                    isToday={data.isToday}
                    isPast={data.isPast}
                    onDayClick={handleDayClick}
                    selectedParticipants={selectedParticipants}
                  />
                ))}
              </Grid>
            </Box>

            {/* Legend (Updated) */}
            <VStack align="flex-start" mt={4} spacing={1}>
              <Text fontSize="sm" fontWeight="semibold">สัญลักษณ์แสดงสถานะความว่าง:</Text>
              <HStack>
                <Box w="10px" h="10px" bg="green.100" borderRadius="full" border="1px solid green.600" />
                <Text fontSize="sm">สามารถนัดหมายได้</Text>
              </HStack>
              {/* <HStack>
                <Box w="10px" h="10px" bg="green.100" borderRadius="full" border="1px solid green.600" />
                <Text fontSize="sm">ว่างบางส่วน (มีงานสั้นๆ/บางคนว่าง)</Text>
              </HStack> */}
              <HStack>
                <Box w="10px" h="10px" bg="red.100" borderRadius="full" border="1px solid red.600" />
                <Text fontSize="sm">ไม่สามารถนัดหมายได้</Text>
              </HStack>
            </VStack>
          </VStack>
        </Box>
      </Center>
    </Box>
  );
}