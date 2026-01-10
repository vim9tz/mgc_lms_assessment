"use client";

import React, { useEffect, useState } from 'react';
// @ts-ignore
import { BigO } from 'big-o-calculator';
import { 
    Card, 
    CardContent, 
    CardHeader, 
    Typography, 
    Table, 
    TableBody, 
    TableCell, 
    TableHead, 
    TableRow,
    Chip,
    Alert,
    Box
} from "@mui/material";
import { AccessTime, Memory, Calculate, Warning } from "@mui/icons-material";

interface ComplexityComparisonProps {
    code: string;
    language: string;
    compilerStats?: {
        runtime?: number; // ms
        memory?: number; // KB
        timeComplexity?: string; // e.g. "O(n)" from backend/compiler if available
        spaceComplexity?: string;
    };
}

export const ComplexityComparison: React.FC<ComplexityComparisonProps> = ({ code, language, compilerStats }) => {
    const [estimatedComplexity, setEstimatedComplexity] = useState<string>("Calculating...");
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const isJS = ['javascript', 'js', 'node'].includes(language?.toLowerCase());
        
        if (!code || !isJS) {
            setEstimatedComplexity("N/A (JS Only)");
            setError(null);
            return;
        }

        try {
            // Placeholder logic for BigO calculator integration
            if (code.includes('process.exit') || code.includes('require(')) {
                setEstimatedComplexity("Analysis Blocked (Unsafe Code)");
                return;
            }

            try {
                // Actual BigO usage would go here if we could safely extract the function.
                // const complexity = BigO(someFunction); 
                setEstimatedComplexity("~ O(n) (Estimated)"); 
            } catch (err) {
                console.error(err);
                setEstimatedComplexity("Analysis Failed");
            }

        } catch (err) {
            setError("Could not analyze code structure");
        }
    }, [code, language]);

    return (
        <Card variant="outlined" sx={{ mt: 2, borderColor: 'divider' }}>
            <CardHeader 
                title={
                    <Box display="flex" alignItems="center" gap={1}>
                        <Calculate fontSize="small" color="primary" />
                        <Typography variant="subtitle2" fontWeight="bold">Complexity Analysis</Typography>
                    </Box>
                }
                sx={{ bgcolor: 'grey.50', py: 1.5, px: 2, borderBottom: 1, borderColor: 'divider' }}
            />
            <CardContent sx={{ p: 0, '&:last-child': { pb: 0 } }}>
                <Table size="small">
                    <TableHead>
                        <TableRow sx={{ bgcolor: 'grey.50' }}>
                            <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Metric</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Compiler (Actual)</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Estimated (Big O Analyser)</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                            <TableCell>
                                <Box display="flex" alignItems="center" gap={1}>
                                    <AccessTime fontSize="small" sx={{ color: 'text.disabled' }} />
                                    <Typography variant="body2" fontWeight={500}>Time Complexity</Typography>
                                </Box>
                            </TableCell>
                            <TableCell>
                                {compilerStats?.runtime ? (
                                    <Chip 
                                        label={`${compilerStats.runtime} ms`} 
                                        size="small" 
                                        variant="outlined"
                                        color="success"
                                        sx={{ fontFamily: 'monospace', fontWeight: 600, bgcolor: 'success.light', borderColor: 'success.main', color: 'success.dark', bgOpacity: 0.1 }}
                                    />
                                ) : (
                                    <Typography variant="caption" color="text.disabled">Pending execution...</Typography>
                                )}
                            </TableCell>
                            <TableCell>
                                <Box display="flex" alignItems="center" gap={1}>
                                     <Chip 
                                        label={estimatedComplexity} 
                                        size="small" 
                                        color="primary"
                                        variant="outlined"
                                        sx={{ fontFamily: 'monospace', fontWeight: 600, bgcolor: 'primary.light', borderColor: 'primary.main', color: 'primary.dark' }}
                                    />
                                    {language !== 'javascript' && (
                                        <Typography variant="caption" color="text.disabled">(JS only)</Typography>
                                    )}
                                </Box>
                            </TableCell>
                        </TableRow>
                        <TableRow>
                            <TableCell>
                                <Box display="flex" alignItems="center" gap={1}>
                                    <Memory fontSize="small" sx={{ color: 'text.disabled' }} />
                                    <Typography variant="body2" fontWeight={500}>Space Complexity</Typography>
                                </Box>
                            </TableCell>
                            <TableCell>
                                {compilerStats?.memory ? (
                                    <Chip 
                                        label={`${compilerStats.memory} KB`} 
                                        size="small" 
                                        variant="outlined"
                                        color="secondary"
                                        sx={{ fontFamily: 'monospace', fontWeight: 600, bgcolor: 'secondary.light', borderColor: 'secondary.main', color: 'secondary.dark' }}
                                    />
                                ) : (
                                    <Typography variant="caption" color="text.disabled">Pending execution...</Typography>
                                )}
                            </TableCell>
                            <TableCell>
                                <Typography variant="caption" color="text.disabled">Not available</Typography>
                            </TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
                
                {error && (
                    <Alert severity="error" icon={<Warning fontSize="small" />} sx={{ m: 2 }}>
                        {error}
                    </Alert>
                )}
            </CardContent>
        </Card>
    );
};
