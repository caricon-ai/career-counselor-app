import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

// 支払い完了ページ
export default function PaymentSuccess() {
  const navigate = useNavigate();

  // 3秒後にホームへ自動移動
  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/scenario");
    }, 3000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.icon}>🎉</div>
        <h1 style={styles.title}>お申し込みありがとうございます！</h1>
        <p style={styles.message}>
          決済が完了しました。<br />
          キャリコン実技試験対策AIをご利用いただけます。
        </p>
        <p style={styles.redirect}>3秒後に自動的に移動します...</p>
        <button onClick={() => navigate("/scenario")} style={styles.button}>
          今すぐ練習を始める
        </button>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    padding: "20px",
  },
  card: {
    backgroundColor: "white",
    borderRadius: "12px",
    padding: "40px",
    maxWidth: "480px",
    width: "100%",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
    textAlign: "center",
  },
  icon: {
    fontSize: "64px",
    marginBottom: "16px",
  },
  title: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#1a1a1a",
    marginBottom: "16px",
  },
  message: {
    color: "#555",
    lineHeight: "1.8",
    marginBottom: "16px",
  },
  redirect: {
    color: "#999",
    fontSize: "14px",
    marginBottom: "24px",
  },
  button: {
    padding: "14px 32px",
    backgroundColor: "#2563eb",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontSize: "16px",
    fontWeight: "bold",
    cursor: "pointer",
  },
};
