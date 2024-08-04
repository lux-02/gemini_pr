const { GoogleGenerativeAI } = require("@google/generative-ai");

export default async function handler(req, res) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_GEMINI_API_KEY;

  // GoogleGenerativeAI 초기화
  const genAI = new GoogleGenerativeAI(apiKey);

  // gemini-1.5-flash 모델 사용
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  if (req.method === "POST") {
    try {
      const { content } = req.body;

      // 레이블링 프롬프트
      const labelPrompt = `
        - 입력된 메일 내용의 어투와 문체에 대해서도 분석하여 스팸 확률을 판단한다. 또한 입력된 메일 내용에 적합한 레이블링을 수행한다.
        # 메일 레이블링 기준
        1. [사적]: 개인적으로 또는 업무용으로 주고 받은 메일
        2. [사적(초대)]: SNS에서 개인계정으로 보내는 광고•알림 메시지(초대 등)
        3. [광고(정상)]: 수신자가 수신을 동의한 광고메일
        4. [광고(기존거래관계)]: 최근 6개월 이내에 기존거래관계(재화를 구매하거나 서비스를 이용하고 대가를 지불)가 있는 경우임
        5. [스팸(도박)]: 국내외 도박사이트 또는 오프라인 도박 장소를 광고
        6. [스팸(불법대출)]: 신용대출, 주택담보대출, 카드론(장기카드대출), 햇살론, 국민 행복기금, 이지론, 정부지원상품 등 대출 관련 광고, 불법대출 상품 광고(정식 은행 명칭과 유사한 명칭 사용, 정부지원 사칭 등)
        7. [스팸(의약품)]: 비아그라, 시알리스 등 불법적으로 거래되는 의약품(건강 보조식품 제외) 광고
        8. [스팸(금융-주식)]: 리딩방, 증권사 및 증권방송, 투자컨설팅사, 자산운용사 등에서 보낸 주식관련 정보
        9. [스팸(금융-카드/보험/은행 등)]: 신용카드사, 은행, 보험사에서 보낸 상품(자동차 보험, 생명 보험 등) 및 서비스 광고(대출상품 제외)
        10. [스팸(재태크/투자)]: 코인, 금융 등 재테크 투자 등을 권유하는 내용
        11. [스팸(성인)]: 성에 관한 음란한 표현의 문구, 그림, 사진, 동영상이 포함 되어있거나 그러한 내용의 사이트로 접속을 유도하는 광고 (유흥주점, 성매매 알선 광고 등)
        12. [스팸(교육/유학)]: 자격증 및 학위취득, 교재 판매, 유학 등의 내용을 담은 광고
        13. [스팸(건강정보)]: 불법적인 의약품 이외의 건강 정보, 건강보조식품 등 광고
        14. [스팸(취업/창업)]: 청년·중장년•실버 취업, 안정적인 일자리(직업), 창업 등 안내, 홍보, 권유 등 내용
        15. [스팸(통신가입)]: 인터넷 서비스 가입, 휴대전화 신규 가입, 번호이동 권유 등 통신가입 내용
        16. [스팸(그 외 유형)]: 기존 스팸 분류에 포함되지 않으면서 수신자를 기만하거나 사회적으로 물의를 일으키는 내용을 포함한 메일, 수신자를 기만하거나 사회적으로 물의를 일으키는 내용이 아니면서, 교육, 건강정보로 분류되지 않는 메일, 직접적인 사기행위 관련여부는 알 수 없으나, 고가물품 무료증정, 경품당첨, 투자유도 등 거짓된 내용으로 수신자를 기만하는 내용의 메일
        ---
        입력된 메일:
        ${content.replace(/\n/g, " ")}
      `;

      // 피싱 분석 프롬프트
      const spamPrompt = `
        - 입력된 메일 내용의 어투와 문체에 대해서도 분석하여 피싱 메일 위험도를 판단한다. (피싱 위험도와 이유 양식을 무조건 지킨다.)
        ---
        입력된 메일:
        ${content.replace(/\n/g, " ")}
      `;

      // 레이블링 분석 요청
      const labelResult = await model.generateContent(labelPrompt);
      const labelResponse = await labelResult.response;
      const labelText = await labelResponse.text();

      // 피싱 위험도 분석 요청
      const spamResult = await model.generateContent(spamPrompt);
      const spamResponse = await spamResult.response;
      const spamText = await spamResponse.text();

      const result = {
        labelAnalysis: labelText,
        spamAnalysis: spamText,
      };

      res.status(200).json(result);
    } catch (error) {
      console.error("Google Gemini API error:", error);
      res.status(500).json({ error: "Failed to generate content." });
    }
  } else {
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
