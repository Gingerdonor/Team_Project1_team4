// src/pages/Selection.jsx
import { motion } from "framer-motion";
import SpaceBackground from "../components/SpaceBackground";
import FlipCard from "../components/FlipCard";
import { FaCog } from "react-icons/fa"; // 설정 아이콘
import { useNavigate } from "react-router-dom";

const Selection = () => {
  const navigate = useNavigate();

  return (
    <SpaceBackground>
      {/* 상단 헤더 */}
      <div style={{ position: "absolute", top: 20, right: 20 }}>
        <FaCog size={30} style={{ cursor: "pointer", opacity: 0.8 }} onClick={() => navigate("/settings")} />
      </div>
      
      <div style={{ position: "absolute", top: 20 }}>
        <div style={userBadgeStyle}>
          🤖 USER_NAME <span style={{fontSize: '0.8rem', color:'#aaa'}}>Lv.42</span>
        </div>
      </div>

      {/* 카드 배치 영역 */}
      <div style={{ display: "flex", gap: "50px", flexWrap: "wrap", justifyContent: "center" }}>
        
        {/* 왼쪽 카드: Persona */}
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <FlipCard 
            title="My Persona" 
            color="#ff7675" 
            description="오늘 당신의 오행 에너지는 '불(Fire)'입니다. 열정적인 태도가 행운을 부릅니다!" 
          />
        </motion.div>

        {/* 오른쪽 카드: Destiny */}
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <FlipCard 
            title="My Destiny" 
            color="#74b9ff" 
            description="오늘 당신의 귀인은 'ESTJ' 성향을 가진 사람입니다. 주변을 잘 살펴보세요." 
          />
        </motion.div>

      </div>
    </SpaceBackground>
  );
};

const userBadgeStyle = {
  padding: "10px 20px",
  background: "rgba(255,255,255,0.1)",
  border: "1px solid rgba(255,255,255,0.2)",
  borderRadius: "20px",
  backdropFilter: "blur(5px)",
  fontWeight: "bold",
  textShadow: "0 0 5px white"
};

export default Selection;