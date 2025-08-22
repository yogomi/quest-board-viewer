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
import DatabaseInfoSection from "./DatabaseInfoSection"

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

      <Accordion>
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="dbinfo-content"
          id="dbinfo-header"
        >
          <Typography variant="h6">データベース情報</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <DatabaseInfoSection />
        </AccordionDetails>
      </Accordion>
    </Box>
  )
}

export default SystemSettings
