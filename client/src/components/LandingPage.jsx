import { Box, Button, Card, CardContent, CardHeader, Grid, TextField, Typography } from "@mui/material";
import { useState } from "react";
import { useNavigate } from "react-router-dom";


function LandingPage() {
    const [meetingCode, setMeetingCode] = useState();
    const navigate = useNavigate();

    const handleMeetingJoin = () => {
        navigate(`meeting/${meetingCode}`)
    }

    return <div style={{ maxWidth: "70%", margin: "auto", marginTop: "40px" }}>
        <Grid container spacing={8}>
            <Grid item xs={8} md={6}>
                <Card>
                    <CardHeader title="Create an instant meeting" />
                    <CardContent>
                        <Typography>Enter Room Code To Create/Join</Typography>
                        <Box sx={{ paddingTop: 4, display: "flex", alignItems: "center" }}>
                            <TextField value={meetingCode} onChange={(e) => setMeetingCode(e.target.value)} id="outlined-basic" label="Code" variant="outlined" />
                            <Button onClick={handleMeetingJoin} style={{ marginLeft: 8 }} variant="contained">Join</Button>
                        </Box>

                    </CardContent>

                </Card>
            </Grid>
            <Grid item xs={8} md={6}>
                <Card>
                    <CardHeader title="Create an instant meeting" />
                    <CardContent>
                        <Typography>create a meeting room</Typography>
                    </CardContent>
                </Card>
            </Grid>
        </Grid>
    </div>
}

export default LandingPage;