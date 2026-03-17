// src/pages/PrivacyPolicy.jsx - プライバシーポリシー

import { Link } from "react-router-dom";

export default function PrivacyPolicy() {
  return (
    <div style={{ background: "#f3f6fb", minHeight: "100vh", padding: "40px 20px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", background: "#fff", borderRadius: 12, padding: 40 }}>
        <h1 style={{ fontSize: 22, fontWeight: "bold", marginBottom: 8 }}>
          プライバシーポリシー
        </h1>
        <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 32 }}>最終更新日：2026年3月17日</p>

        {/* 第1条 */}
        <h2 style={sectionTitle}>第1条（個人情報の定義）</h2>
        <p style={paragraph}>
          本プライバシーポリシーにおける「個人情報」とは、個人情報保護法に定める個人情報を指し、
          生存する個人に関する情報であって、氏名・メールアドレスなど特定の個人を識別できる情報をいいます。
        </p>

        {/* 第2条 */}
        <h2 style={sectionTitle}>第2条（収集する個人情報）</h2>
        <p style={paragraph}>当サービスでは、以下の情報を収集することがあります。</p>
        <ul style={list}>
          <li>メールアドレス（アカウント登録時）</li>
          <li>決済情報（Stripeを通じて処理。当サービスはカード情報を直接保持しません）</li>
          <li>サービス利用ログ（アクセス日時、使用機能など）</li>
        </ul>

        {/* 第3条 */}
        <h2 style={sectionTitle}>第3条（個人情報の利用目的）</h2>
        <p style={paragraph}>収集した個人情報は、以下の目的にのみ使用します。</p>
        <ul style={list}>
          <li>サービスの提供・運営</li>
          <li>お問い合わせへの対応</li>
          <li>サービスに関する重要なお知らせの送付</li>
          <li>利用規約違反の対応</li>
        </ul>

        {/* 第4条 */}
        <h2 style={sectionTitle}>第4条（第三者への提供）</h2>
        <p style={paragraph}>
          当サービスは、以下の場合を除き、ユーザーの個人情報を第三者に提供しません。
        </p>
        <ul style={list}>
          <li>ユーザーの同意がある場合</li>
          <li>法令に基づく場合</li>
          <li>人の生命・身体・財産の保護のために必要な場合</li>
        </ul>

        {/* 第5条 */}
        <h2 style={sectionTitle}>第5条（業務委託先への提供）</h2>
        <p style={paragraph}>
          当サービスは、以下のサービスを利用してサービスを提供しています。
          これらのサービスに個人情報の一部が提供されることがあります。
        </p>
        <ul style={list}>
          <li>Supabase（認証・データ管理）</li>
          <li>Stripe（決済処理）</li>
          <li>OpenAI（AIによる会話・フィードバック生成）</li>
          <li>Vercel（サービスのホスティング）</li>
        </ul>

        {/* 第6条 */}
        <h2 style={sectionTitle}>第6条（個人情報の管理）</h2>
        <p style={paragraph}>
          当サービスは、個人情報の紛失・破壊・改ざん・漏えいを防ぐため、適切なセキュリティ対策を実施します。
        </p>

        {/* 第7条 */}
        <h2 style={sectionTitle}>第7条（開示・訂正・削除の請求）</h2>
        <p style={paragraph}>
          ユーザーは、当サービスが保有する自己の個人情報の開示・訂正・削除を請求できます。
          下記のお問い合わせ先までご連絡ください。
        </p>

        {/* 第8条 */}
        <h2 style={sectionTitle}>第8条（Cookie・アクセス解析）</h2>
        <p style={paragraph}>
          当サービスでは、サービス改善のためにアクセス解析ツールを使用する場合があります。
          これらのツールはCookieを使用しますが、個人を特定する情報は収集しません。
        </p>

        {/* 第9条 */}
        <h2 style={sectionTitle}>第9条（プライバシーポリシーの変更）</h2>
        <p style={paragraph}>
          当サービスは、必要に応じて本ポリシーを変更することがあります。
          変更後のポリシーは本ページに掲載した時点で効力を生じます。
        </p>

        {/* お問い合わせ */}
        <h2 style={sectionTitle}>お問い合わせ</h2>
        <p style={paragraph}>
          個人情報の取り扱いに関するお問い合わせは、下記までご連絡ください。<br />
          事業者名：笠原 直樹<br />
          メール：kasane1101@gmail.com
        </p>

        {/* フッターリンク */}
        <div style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid #e5e7eb", display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13 }}>
          <Link to="/" style={{ color: "#6b7280", textDecoration: "underline" }}>トップページ</Link>
          <Link to="/terms" style={{ color: "#6b7280", textDecoration: "underline" }}>利用規約</Link>
          <Link to="/legal" style={{ color: "#6b7280", textDecoration: "underline" }}>特定商取引法に基づく表記</Link>
        </div>
      </div>
    </div>
  );
}

// スタイル定数
const sectionTitle = {
  fontSize: 16,
  fontWeight: "bold",
  marginTop: 28,
  marginBottom: 8,
  color: "#1f2937",
};

const paragraph = {
  fontSize: 15,
  lineHeight: 1.8,
  color: "#4b5563",
  marginBottom: 8,
};

const list = {
  fontSize: 15,
  lineHeight: 2,
  color: "#4b5563",
  paddingLeft: 24,
  marginBottom: 8,
};
