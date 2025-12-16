import { useState } from "react";
import {
    Box,
    Button,
    Container,
    FormControl,
    FormLabel,
    Heading,
    Input,
    Stack,
    useToast,
    Image,
    Center,
} from "@chakra-ui/react";
import axios from "axios";
import { useRouter } from "next/router";

export default function LoginPage() {
    const [email, setEmail] = useState("admin@brainwave.com");
    const [password, setPassword] = useState("123123123");
    const [isLoading, setIsLoading] = useState(false);
    const toast = useToast();
    const router = useRouter();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await axios.post("/api/login", {
                email,
                password,
            });

            console.log("Login successful", response.data);

            // Store token in localStorage
            if (response.data.token) {
                localStorage.setItem("token", response.data.token);
            }

            toast({
                title: "Success",
                description: "Login successful",
                status: "success",
                duration: 3000,
                isClosable: true,
            });

            // Redirect to home page after successful login
            router.push("/");
        } catch (error: any) {
            console.log(error);
            toast({
                title: "Error",
                description: error.response?.data?.error || "Login failed",
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Container>
            <Box h="100vh" alignContent={"center"}>
                <Center>
                    <Image src="/amai-logo.png" alt="AM AI Logo" maxH="80px" mb={4} />
                </Center>
                <Stack spacing="8">
                    <Heading textAlign="center" size="lg">
                        {/* Sign in to your account */}
                    </Heading>

                    <Box as="form" onSubmit={handleSubmit}>
                        <Stack spacing="6">
                            <FormControl isRequired>
                                <FormLabel htmlFor="email">Email</FormLabel>
                                <Input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                />
                            </FormControl>

                            <FormControl isRequired>
                                <FormLabel htmlFor="password">Password</FormLabel>
                                <Input
                                    id="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter password"
                                />
                            </FormControl>

                            <Button
                                type="submit"
                                colorScheme="blue"
                                size="lg"
                                isLoading={isLoading}
                            >
                                Sign in
                            </Button>
                        </Stack>
                    </Box>
                </Stack>
            </Box>
        </Container>
    );
}