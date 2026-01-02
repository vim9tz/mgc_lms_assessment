// app/guest-test/page.tsx
"use client";
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Zoom, toast } from 'react-toastify'
import useApi from '@/hooks/useApi';
import LoaderDashboard from '../academy/lazyloader/LoaderDashboard';
import AppReactToastify from '@/libs/styles/AppReactToastify';
import { Button, CircularProgress } from '@mui/material';

interface Weightage {
    type: string;
    mod_name: string;
    qus: string;
    weight: number;
    obtained: string;
}

interface TestAttemptResponse {
    attempts: string;
    weightage: Weightage[];
    test_name: string;
    test_start_date: string;
    test_end_date: string;
    start_time: string;
    end_time: string;
    test_duration: number;
    total_modules: number;
}

export default function GuestTestIntro() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const tokenFromURL = searchParams.get("token");
    const { fetchFromBackend } = useApi(); // true for guest access
    const [loading, setLoading] = useState(true);
    const [load, setLoad] = useState(false);
    const [testData, setTestData] = useState<TestAttemptResponse | null>(null);
    const [error, setError] = useState<string | null>(null);
    const KgGeeksUrl = process.env.NEXT_PUBLIC_KGGEEKS_URL

    const navigateGuest = async () => {
        setLoad(true)
        toast("Redirecting to test portal.", { position: "bottom-right", theme: "dark", transition: Zoom })
        setTimeout(() => {
           router.push(`/?token=${tokenFromURL}`);
        }, 2000)
        setLoad(false)
      }

    useEffect(() => {

        if (!tokenFromURL) {
            setError("❌ Missing test token in URL.");
            setLoading(false);
            return;
        }

        if (tokenFromURL) {
            (async () => {
                try {
                    setLoading(true);
                    const data: TestAttemptResponse = await fetchFromBackend("/guestAttempt", "POST", {
                        test_id: tokenFromURL,
                    });
                    setTestData(data);
                    // console.log("Test Data:", data);
                } catch (err: any) {
                    console.error("Error fetching test data:", err);
                    setTestData(null);
                } finally {
                    setLoading(false);
                }
            })();
        } else {
            console.error("No token found in URL");
            setLoading(false);
        }

    }, [searchParams]);

    if (loading) return <LoaderDashboard />;
    if (error) {
        return (
            <div className="p-8">
                <div className="max-w-2xl mx-auto bg-white border border-red-200 rounded-xl shadow-sm p-6 flex items-start gap-4">
                    <div className="text-red-500 text-2xl">⚠️</div>
                    <div>
                        <h2 className="text-xl font-semibold text-red-600 mb-1">Access Denied</h2>
                        <p className="text-sm text-gray-700">{error}</p>
                        <p className="text-sm text-gray-500 mt-2">
                            Please make sure you have a valid guest access link.
                        </p>
                    </div>
                </div>
            </div>
        );
    }
    return (
        <div className=" p-8">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Welcome Banner */}
                <div className="bg-white rounded-xl shadow-sm p-6 flex justify-between items-center">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">Welcome, Guest 👋</h1>
                        <p className="text-sm text-gray-500 mt-1">You're about to begin your test. Please review the information below carefully.</p>
                    </div>
                    <div className="text-right text-sm text-gray-600">
                        <p><strong>Duration:</strong> {testData?.test_duration}</p>
                        <p><strong>Modules:</strong> {testData?.total_modules}</p>
                    </div>
                </div>

                {/* Stat Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center">
                        <p className="text-blue-600 font-semibold">Test Start Time</p>
                        <p className="text-xl font-bold">{new Date(testData?.test_start_date || '').toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                            })}{" "}{testData?.start_time}</p>
                    </div>
                    <div className="bg-green-50 border border-green-200 rounded-xl p-4 text-center">
                        <p className="text-green-600 font-semibold">Test End Time</p>
                        <p className="text-xl font-bold">{new Date(testData?.test_end_date || '').toLocaleDateString(undefined, {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                            })}{" "}{testData?.start_time}</p>
                    </div>
                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-center">
                        <p className="text-yellow-600 font-semibold">Auth type</p>
                        <p className="text-xl font-bold">Guest
                        </p>
                    </div>
                </div>

                {/* Instructions + Requirements */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">📘 Instructions</h2>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-2">
                            <li>All questions are mandatory.</li>
                            <li>No going back once a question is answered.</li>
                            <li>Submit before time runs out.</li>
                            <li>One session/tab only.</li>
                        </ul>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm p-6">
                        <h2 className="text-lg font-semibold text-gray-800 mb-4">🔧 Requirements</h2>
                        <ul className="list-disc list-inside text-sm text-gray-600 space-y-2">
                            <li>Latest Chrome, Firefox, or Edge browser.</li>
                            <li>Stable internet (2 Mbps or higher).</li>
                            <li>JavaScript and cookies must be enabled.</li>
                            <li>Full screen mode recommended.</li>
                        </ul>
                    </div>
                </div>
                {/* Question Summary Table */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-gray-800 mb-4">Question Breakdown</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                            <thead className="bg-primaryLight text-gray-600 text-left">
                                <tr>
                                    <th className="py-2 px-4">#</th>
                                    <th className="py-2 px-4">Assessment Type</th>
                                    <th className="py-2 px-4">Course Module</th>
                                    <th className="py-2 px-4">Total Questions</th>
                                    <th className="py-2 px-4">Weightage</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {testData?.weightage.map((q, index) => (
                                    <tr key={index} className="hover:bg-gray-50 transition">
                                        <td className="py-2 px-4 font-medium text-gray-700">{index + 1}</td>
                                        <td className="py-2 px-4 text-gray-600">{q.type}</td>
                                        <td className="py-2 px-4 text-gray-600">{q.mod_name}</td>
                                        <td className="py-2 px-4 text-gray-600">{q.qus}</td>
                                        <td className="py-2 px-4 text-gray-600">{q.weight}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Start Button */}
                <div className="text-center pt-4">
        <Button
          variant="contained"
          size="medium"
          className="mt-5"
          onClick={navigateGuest}
          disabled={load}
          endIcon={load ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {load ? "Start test" : "Start test"}
        </Button>
                </div>
            </div>
                        <AppReactToastify />
        </div>
    );
}
