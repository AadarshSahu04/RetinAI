import os
from datetime import datetime
from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, Image as RLImage, HRFlowable
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT
import logging

logger = logging.getLogger(__name__)

SEVERITY_COLORS = {
    "No DR": colors.HexColor("#16a34a"),
    "Mild DR": colors.HexColor("#ca8a04"),
    "Moderate DR": colors.HexColor("#ea580c"),
    "Severe DR": colors.HexColor("#dc2626"),
    "Proliferative DR": colors.HexColor("#7c3aed"),
}

SEVERITY_RECOMMENDATIONS = {
    "No DR": "No signs of diabetic retinopathy detected. Continue regular annual eye examinations and maintain good blood sugar control.",
    "Mild DR": "Early signs of diabetic retinopathy detected. Follow-up examination in 6-12 months recommended. Maintain strict blood sugar and blood pressure control.",
    "Moderate DR": "Moderate diabetic retinopathy detected. Referral to an ophthalmologist within 3-6 months. Strict control of diabetes, blood pressure, and lipids is essential.",
    "Severe DR": "Severe diabetic retinopathy detected. Urgent referral to a retinal specialist within 1 month. Laser treatment or other intervention may be necessary.",
    "Proliferative DR": "Proliferative diabetic retinopathy detected — a vision-threatening condition. Immediate referral to a retinal specialist required. Treatment may include laser photocoagulation or vitrectomy.",
}


def generate_report(patient, prediction_details: dict, reports_dir: str) -> str:
    os.makedirs(reports_dir, exist_ok=True)
    timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
    filename = f"report_patient_{patient.id}_{timestamp}.pdf"
    filepath = os.path.join(reports_dir, filename)

    doc = SimpleDocTemplate(
        filepath,
        pagesize=letter,
        rightMargin=0.75 * inch,
        leftMargin=0.75 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch
    )

    styles = getSampleStyleSheet()
    story = []

    # ── Header ──────────────────────────────────────────────────────────────
    header_style = ParagraphStyle(
        "header", parent=styles["Normal"],
        fontSize=22, fontName="Helvetica-Bold",
        textColor=colors.HexColor("#0f172a"), alignment=TA_CENTER, spaceAfter=4
    )
    sub_style = ParagraphStyle(
        "sub", parent=styles["Normal"],
        fontSize=10, fontName="Helvetica",
        textColor=colors.HexColor("#64748b"), alignment=TA_CENTER, spaceAfter=2
    )

    story.append(Paragraph("Diabetic Retinopathy Detection Report", header_style))
    story.append(Paragraph("AI-Assisted Retinal Analysis System", sub_style))
    story.append(Paragraph(f"Generated: {datetime.utcnow().strftime('%B %d, %Y at %H:%M UTC')}", sub_style))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#0f172a"), spaceAfter=16))

    # ── Patient Info ─────────────────────────────────────────────────────────
    section_style = ParagraphStyle(
        "section", parent=styles["Normal"],
        fontSize=13, fontName="Helvetica-Bold",
        textColor=colors.HexColor("#0f172a"), spaceBefore=12, spaceAfter=8
    )
    story.append(Paragraph("Patient Information", section_style))

    patient_data = [
        ["Patient Name", patient.name],
        ["Age", f"{patient.age} years"],
        ["Gender", patient.gender.capitalize()],
        ["Record ID", f"#{patient.id:04d}"],
        ["Examination Date", patient.created_at.strftime("%B %d, %Y")],
    ]
    patient_table = Table(patient_data, colWidths=[2.2 * inch, 4.5 * inch])
    patient_table.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (0, -1), colors.HexColor("#f1f5f9")),
        ("FONTNAME", (0, 0), (0, -1), "Helvetica-Bold"),
        ("FONTNAME", (1, 0), (1, -1), "Helvetica"),
        ("FONTSIZE", (0, 0), (-1, -1), 10),
        ("TEXTCOLOR", (0, 0), (0, -1), colors.HexColor("#374151")),
        ("TEXTCOLOR", (1, 0), (1, -1), colors.HexColor("#111827")),
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
        ("PADDING", (0, 0), (-1, -1), 8),
        ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story.append(patient_table)

    # ── Retinal Image ────────────────────────────────────────────────────────
    story.append(Spacer(1, 16))
    story.append(Paragraph("Retinal Fundus Image", section_style))

    img_path = patient.image_path
    if os.path.exists(img_path):
        try:
            rl_img = RLImage(img_path, width=3.5 * inch, height=3.5 * inch)
            rl_img.hAlign = "CENTER"
            story.append(rl_img)
        except Exception as e:
            logger.warning(f"Could not embed image: {e}")
            story.append(Paragraph("[Retinal image could not be embedded]", styles["Normal"]))
    else:
        story.append(Paragraph("[Retinal image not found on disk]", styles["Normal"]))

    # ── Prediction Result ────────────────────────────────────────────────────
    story.append(Spacer(1, 16))
    story.append(Paragraph("Diagnosis Result", section_style))

    result = patient.result
    confidence = patient.confidence
    result_color = SEVERITY_COLORS.get(result, colors.HexColor("#6b7280"))

    result_style = ParagraphStyle(
        "result", parent=styles["Normal"],
        fontSize=18, fontName="Helvetica-Bold",
        textColor=result_color, alignment=TA_CENTER, spaceAfter=4
    )
    story.append(Paragraph(result, result_style))

    conf_pct = f"{confidence * 100:.1f}%"
    conf_style = ParagraphStyle(
        "conf", parent=styles["Normal"],
        fontSize=11, fontName="Helvetica",
        textColor=colors.HexColor("#6b7280"), alignment=TA_CENTER, spaceAfter=12
    )
    story.append(Paragraph(f"Model Confidence: {conf_pct}", conf_style))

    # Probability breakdown
    if prediction_details and "all_probabilities" in prediction_details:
        story.append(Paragraph("Class Probabilities", section_style))
        prob_rows = [["Diagnosis Class", "Probability"]]
        for cls, prob in prediction_details["all_probabilities"].items():
            prob_rows.append([cls, f"{prob * 100:.2f}%"])

        prob_table = Table(prob_rows, colWidths=[3.5 * inch, 3.2 * inch])
        prob_table.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
            ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
            ("FONTNAME", (0, 1), (-1, -1), "Helvetica"),
            ("FONTSIZE", (0, 0), (-1, -1), 10),
            ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.white, colors.HexColor("#f8fafc")]),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#e2e8f0")),
            ("PADDING", (0, 0), (-1, -1), 8),
            ("ALIGN", (1, 0), (1, -1), "CENTER"),
        ]))
        story.append(prob_table)

    # ── Clinical Recommendation ──────────────────────────────────────────────
    story.append(Spacer(1, 16))
    story.append(Paragraph("Clinical Recommendation", section_style))

    recommendation = SEVERITY_RECOMMENDATIONS.get(
        result,
        "Please consult with a qualified ophthalmologist for further evaluation."
    )
    rec_style = ParagraphStyle(
        "rec", parent=styles["Normal"],
        fontSize=10, fontName="Helvetica",
        textColor=colors.HexColor("#1e293b"),
        leading=16, spaceAfter=12,
        leftIndent=12, rightIndent=12,
        borderPad=10,
        backColor=colors.HexColor("#f0fdf4") if result == "No DR" else colors.HexColor("#fff7ed")
    )
    story.append(Paragraph(recommendation, rec_style))

    # ── Disclaimer ───────────────────────────────────────────────────────────
    story.append(Spacer(1, 24))
    story.append(HRFlowable(width="100%", thickness=0.5, color=colors.HexColor("#cbd5e1")))
    disclaimer_style = ParagraphStyle(
        "disclaimer", parent=styles["Normal"],
        fontSize=8, fontName="Helvetica",
        textColor=colors.HexColor("#94a3b8"), alignment=TA_CENTER, spaceBefore=8
    )
    story.append(Paragraph(
        "DISCLAIMER: This report is generated by an AI-assisted diagnostic tool and is intended "
        "to support, not replace, clinical judgment. All findings should be reviewed and confirmed "
        "by a qualified medical professional before any clinical decisions are made.",
        disclaimer_style
    ))

    doc.build(story)
    logger.info(f"Report generated: {filepath}")
    return filepath
