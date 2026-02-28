import { useState } from 'react'
import { supabase } from './supabaseClient'

// Hardcoded array of allowed emails
const ALLOWED_EMAILS = [
    'abdulhadiasghar@outlook.com',
    'abdulautomates101@gmail.com',
    'muhammadkhatana661@gmail.com'
    // Add more emails here
]

export default function Auth({ onLogin }) {
    const [email, setEmail] = useState('')
    const [sent, setSent] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    // Shared styles to match App.jsx
    const C = {
        bg: "#080808", bg2: "#0d0d0d", bg3: "#121212",
        border: "#1a1a1a", border2: "#222",
        text: "#C8C5BE", textHi: "#E8E4DC", textDim: "#555",
    }

    const inputStyle = {
        width: "100%", background: "#0a0a0a", border: `1px solid ${C.border2}`,
        borderRadius: 4, color: C.textHi, padding: "10px 14px",
        fontSize: 14, fontFamily: "inherit", outline: "none", lineHeight: 1.6,
        marginBottom: 16
    }

    const buttonStyle = {
        width: "100%",
        padding: "10px",
        background: "#E8C547",
        color: "#080808",
        border: "none",
        borderRadius: 4,
        fontSize: 14,
        fontWeight: "bold",
        cursor: "pointer",
        fontFamily: "inherit"
    }

    const handleSendMagicLink = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        if (!ALLOWED_EMAILS.includes(email.toLowerCase().trim())) {
            setError("This email is not authorized to access the application.")
            setLoading(false)
            return
        }

        const { error } = await supabase.auth.signInWithOtp({
            email: email.trim(),
        })

        if (error) {
            setError(error.message)
        } else {
            setSent(true)
        }
        setLoading(false)
    }

    return (
        <div style={{
            fontFamily: "'IBM Plex Mono','Fira Code','Courier New',monospace",
            minHeight: "100vh",
            background: C.bg,
            color: C.text,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
        }}>
            <div style={{
                background: C.bg2,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: "32px",
                width: "100%",
                maxWidth: "400px"
            }}>
                <div style={{ marginBottom: 24, textAlign: "center" }}>
                    <h2 style={{ color: C.textHi, margin: "0 0 8px 0", fontSize: 24 }}>SSQ Tracker</h2>
                    <p style={{ color: C.textDim, margin: 0, fontSize: 12 }}>Authentication Required</p>
                </div>

                {error && (
                    <div style={{
                        padding: "10px",
                        background: "#4a1c18",
                        border: "1px solid #F06449",
                        color: "#F06449",
                        borderRadius: 4,
                        marginBottom: 16,
                        fontSize: 12
                    }}>
                        {error}
                    </div>
                )}

                {sent ? (
                    <div style={{ textAlign: "center" }}>
                        <div style={{ fontSize: 24, marginBottom: 16 }}>Check your email!</div>
                        <p style={{ color: C.text, fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
                            We've sent a magic login link to <strong>{email}</strong>.
                            Click the link in the email to log in automatically.
                        </p>
                        <button
                            onClick={() => setSent(false)}
                            style={{ background: "none", border: "none", color: C.textDim, fontSize: 12, cursor: "pointer", textDecoration: "underline" }}
                        >
                            Back to email entry
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSendMagicLink}>
                        <label style={{ display: "block", fontSize: 10, letterSpacing: 2, color: C.textDim, marginBottom: 8, textTransform: "uppercase" }}>Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            required
                            style={inputStyle}
                        />
                        <button type="submit" disabled={loading} style={{ ...buttonStyle, opacity: loading ? 0.7 : 1 }}>
                            {loading ? "Sending link..." : "Send Magic Link"}
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}
