import type { NextApiRequest, NextApiResponse } from 'next';
import { serialize } from 'cookie';

type ResponseData = {
    message: string;
    token?: string;
    error?: string;
};

export default async function handler(
    req: NextApiRequest,
    res: NextApiResponse<ResponseData>
) {
    if (req.method !== 'POST') {
        res.status(405).json({ message: 'Method not allowed', error: 'Only POST requests are supported' });
        return;
    }
    console.log(req.body);

    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400).json({ message: 'Missing credentials', error: 'Email and password are required' });
        return;
    }

    try {
        const response = await fetch('https://erp-ai.anodaz.online/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
        });

        const data = await response.json();
        //         exp resp from login api 
        //         {
        //   "success": true,
        //   "data": {
        //     "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VyX2lkIjozLCJpYXQiOjE3NjU4NzM4NjksImV4cCI6MTc2NjA4OTg2OX0.SJ3VMdvmWpbjcQcYWsQyj5rWNvnDcPx7Fm-9gmnFfuI"
        //   },
        //   "message_th": null,
        //   "message_en": null
        // }

        if (!response.ok) {
            res.status(response.status).json({ message: 'Login failed', error: data.message });
            return;
        }
        // set access_token to cookie name token
        res.setHeader('Set-Cookie', serialize('token', data.data.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 60 * 60 * 24 * 7, // 7 days
        }));

        res.status(200).json({ message: 'Login successful', token: data.data.access_token });

    } catch (error) {
        res.status(500).json({ message: 'Server error', error: 'An unexpected error occurred' });
    }
}