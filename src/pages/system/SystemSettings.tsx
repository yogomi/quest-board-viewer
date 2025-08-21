import React from "react"
import {
  Box,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Divider,
} from "@mui/material"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import BackupSection from "./BackupSection"

const SystemSettings: React.FC = () => {
  return (
    <Box maxWidth="lg" mx="auto" p={4}>
      <Typography variant="h4" gutterBottom mb={4}>
        システム設定
      </Typography>

      <Accordion defaultExpanded>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="backup-content"
          id="backup-header"
        >
          <Typography variant="h6">バックアップ管理</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <BackupSection />
        </AccordionDetails>
      </Accordion>

      <Divider sx={{ my: 4 }} />

      {/* 今後のためのセクション例
      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="basicinfo-content"
          id="basicinfo-header"
        >
          <Typography variant="h6">基本情報・統計</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Typography>ここにユーザー数やバージョン情報などを表示予定。</Typography>
        </AccordionDetails>
      </Accordion>
      */}
    </Box>
  )
}

export default SystemSettings
