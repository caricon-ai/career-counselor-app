// src/pages/LegalPage.jsx - 特定商取引法に基づく表記

export default function LegalPage() {
  return (
    <div style={{ background: "#f3f6fb", minHeight: "100vh", padding: "40px 20px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", background: "#fff", borderRadius: 12, padding: 40 }}>
        <h1 style={{ fontSize: 22, fontWeight: "bold", marginBottom: 32 }}>
          特定商取引法に基づく表記
        </h1>

        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 15, lineHeight: 2 }}>
          <tbody>
            {[
              ["販売業者", "キャリコン試験研究所"],
              ["運営統括責任者", "キャリコン試験研究所"],
              ["所在地", "請求があった場合は遅滞なく開示します"],
              ["電話番号", "請求があったら遅滞なく開示します"],
              ["メールアドレス", "kasane1101@gmail.com"],
              ["販売URL", "https://career-counselor-app-two.vercel.app"],
              ["販売価格", "月額5,000円（税込）"],
              ["支払方法", "クレジットカード決済（Stripe）"],
              ["支払時期", "毎月自動決済"],
              ["サービス提供時期", "決済完了後すぐにご利用いただけます"],
              ["返品・キャンセル", "サービスの性質上、返金はお受けできません。ただし、いつでも解約可能です。解約後は次回更新日以降の請求が停止されます。"],
              ["動作環境", "インターネットに接続できるブラウザ（Chrome推奨）"],
            ].map(([label, value]) => (
              <tr key={label} style={{ borderBottom: "1px solid #e5e7eb" }}>
                <td style={{ padding: "12px 8px", fontWeight: "bold", color: "#374151", width: "35%", verticalAlign: "top" }}>
                  {label}
                </td>
                <td style={{ padding: "12px 8px", color: "#4b5563" }}>
                  {value}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
