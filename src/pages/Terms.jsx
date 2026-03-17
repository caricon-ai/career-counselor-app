// src/pages/Terms.jsx - 利用規約

import { Link } from "react-router-dom";

export default function Terms() {
  return (
    <div style={{ background: "#f3f6fb", minHeight: "100vh", padding: "40px 20px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto", background: "#fff", borderRadius: 12, padding: 40 }}>
        <h1 style={{ fontSize: 22, fontWeight: "bold", marginBottom: 8 }}>
          利用規約
        </h1>
        <p style={{ fontSize: 13, color: "#9ca3af", marginBottom: 32 }}>最終更新日：2026年3月17日</p>

        <p style={paragraph}>
          本利用規約（以下「本規約」）は、笠原 直樹（以下「運営者」）が提供する
          「Career Counselor AI」（以下「本サービス」）の利用条件を定めるものです。
          本サービスをご利用いただく場合、本規約に同意したものとみなします。
        </p>

        {/* 第1条 */}
        <h2 style={sectionTitle}>第1条（サービスの内容）</h2>
        <p style={paragraph}>
          本サービスは、2級キャリアコンサルティング技能検定の実技（面接）試験対策として、
          AIを活用したロールプレイ練習とフィードバックを提供するものです。
        </p>

        {/* 第2条 */}
        <h2 style={sectionTitle}>第2条（利用登録）</h2>
        <p style={paragraph}>
          本サービスの利用には、メールアドレスによるアカウント登録および月額料金の支払いが必要です。
          登録にあたり、正確な情報を入力してください。虚偽の情報による登録は禁止します。
        </p>

        {/* 第3条 */}
        <h2 style={sectionTitle}>第3条（料金・決済）</h2>
        <ul style={list}>
          <li>月額料金：1,980円（税込）</li>
          <li>決済方法：クレジットカード（Stripe経由）</li>
          <li>毎月自動更新されます</li>
          <li>月の途中から利用を開始した場合も、その月の料金が発生します</li>
        </ul>

        {/* 第4条 */}
        <h2 style={sectionTitle}>第4条（解約・返金）</h2>
        <ul style={list}>
          <li>解約はいつでも可能です。解約後は次回更新日以降の請求が停止されます</li>
          <li>解約後も当月末まではサービスをご利用いただけます</li>
          <li>サービスの性質上、原則として返金はお受けできません</li>
          <li>ただし、システム障害など運営者の責に帰すべき事由による場合は、個別に対応します</li>
        </ul>

        {/* 第5条 */}
        <h2 style={sectionTitle}>第5条（禁止事項）</h2>
        <p style={paragraph}>以下の行為を禁止します。</p>
        <ul style={list}>
          <li>本サービスのコンテンツを無断で複製・転載・販売する行為</li>
          <li>他のユーザーや第三者に迷惑をかける行為</li>
          <li>本サービスへの不正アクセスや改ざんを試みる行為</li>
          <li>法令または公序良俗に反する行為</li>
          <li>その他、運営者が不適切と判断する行為</li>
        </ul>

        {/* 第6条 */}
        <h2 style={sectionTitle}>第6条（サービスの変更・中断・終了）</h2>
        <p style={paragraph}>
          運営者は、事前通知なくサービスの内容を変更・中断・終了することがあります。
          これによってユーザーに損害が生じた場合でも、運営者は責任を負いません。
        </p>

        {/* 第7条 */}
        <h2 style={sectionTitle}>第7条（免責事項）</h2>
        <p style={paragraph}>
          本サービスのAIによるフィードバックは、試験合格を保証するものではありません。
          本サービスの利用によって生じた損害について、運営者は責任を負いません。
        </p>

        {/* 第8条 */}
        <h2 style={sectionTitle}>第8条（個人情報の取り扱い）</h2>
        <p style={paragraph}>
          個人情報の取り扱いについては、別途定める
          <Link to="/privacy" style={{ color: "#2563eb" }}>プライバシーポリシー</Link>
          に従います。
        </p>

        {/* 第9条 */}
        <h2 style={sectionTitle}>第9条（規約の変更）</h2>
        <p style={paragraph}>
          運営者は、必要に応じて本規約を変更することがあります。
          変更後の規約は本ページに掲載した時点で効力を生じます。
          変更後も本サービスを利用し続けた場合、変更に同意したものとみなします。
        </p>

        {/* 第10条 */}
        <h2 style={sectionTitle}>第10条（準拠法・管轄）</h2>
        <p style={paragraph}>
          本規約は日本法に準拠します。本サービスに関する紛争は、
          鳥取地方裁判所を第一審の専属的合意管轄裁判所とします。
        </p>

        {/* お問い合わせ */}
        <h2 style={sectionTitle}>お問い合わせ</h2>
        <p style={paragraph}>
          本規約に関するお問い合わせは、下記までご連絡ください。<br />
          事業者名：笠原 直樹<br />
          メール：kasane1101@gmail.com
        </p>

        {/* フッターリンク */}
        <div style={{ marginTop: 40, paddingTop: 24, borderTop: "1px solid #e5e7eb", display: "flex", gap: 16, flexWrap: "wrap", fontSize: 13 }}>
          <Link to="/" style={{ color: "#6b7280", textDecoration: "underline" }}>トップページ</Link>
          <Link to="/privacy" style={{ color: "#6b7280", textDecoration: "underline" }}>プライバシーポリシー</Link>
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
