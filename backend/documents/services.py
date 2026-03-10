"""
PDF Document Generation Service using WeasyPrint.
Generates a professional institutional syllabus PDF from subject data.
"""
import io
import os
from datetime import datetime
from django.template.loader import render_to_string
from django.conf import settings
from weasyprint import HTML, CSS
from weasyprint.text.fonts import FontConfiguration


def generate_syllabus_pdf(subject) -> bytes:
    """
    Generate a complete PDF syllabus for the given subject.
    Returns raw PDF bytes.

    Args:
        subject: Subject model instance (should be prefetched)

    Returns:
        bytes: Raw PDF content
    """
    # Build HOD review metadata
    hod_info = _get_hod_info(subject)

    # Build articulation matrix as structured data
    matrix_data = _build_matrix_data(subject)

    context = {
        'subject': subject,
        'hod_info': hod_info,
        'matrix_data': matrix_data,
        'po_labels': ['PO1','PO2','PO3','PO4','PO5','PO6','PO7','PO8','PO9','PO10','PO11','PSO1','PSO2'],
        'generated_at': datetime.now().strftime('%d %B %Y, %H:%M'),
        'institution_name': os.environ.get('INSTITUTION_NAME', 'University Name'),
        'institution_logo': os.path.join(settings.STATIC_ROOT, 'images', 'logo.png'),
    }

    # Render HTML template to string
    html_string = render_to_string('documents/syllabus_pdf.html', context)

    # Load base CSS
    css_path = os.path.join(
        settings.DOCUMENTS_TEMPLATES_DIR, 'syllabus_pdf.css'
    )
    css_content = _get_default_css()
    if os.path.exists(css_path):
        with open(css_path, 'r') as f:
            css_content = f.read()

    # Generate PDF with WeasyPrint
    font_config = FontConfiguration()
    html = HTML(string=html_string, base_url=str(settings.BASE_DIR))
    css = CSS(string=css_content, font_config=font_config)

    pdf_bytes = html.write_pdf(
        stylesheets=[css],
        font_config=font_config,
        presentational_hints=True,
    )
    return pdf_bytes


def _get_hod_info(subject) -> dict:
    """Build the HOD review table metadata."""
    approval = None
    try:
        approval = subject.approval_records.filter(
            action='APPROVED'
        ).order_by('-created_at').first()
    except Exception:
        pass

    try:
        hod = subject.department.hod
        hod_name = hod.full_name if hod else 'Not Assigned'
    except Exception:
        hod_name = 'Not Assigned'

    return {
        'submitted_by': subject.assigned_faculty.full_name if subject.assigned_faculty else '—',
        'department': subject.department.name if subject.department else '—',
        'submitted_to': hod_name,
        'approved_by_hod': 'Yes' if subject.status == 'APPROVED' else 'No',
        'approval_date': approval.created_at.strftime('%d %B %Y') if approval else '—',
        'approval_comments': approval.comments if approval else '—',
        'current_status': subject.get_status_display(),
    }


def _build_matrix_data(subject) -> list:
    """Build structured matrix for template rendering."""
    po_fields = ['po1','po2','po3','po4','po5','po6','po7','po8','po9','po10','po11','pso1','pso2']
    rows = []
    try:
        for row in subject.articulation_rows.select_related('co').all():
            values = [getattr(row, f) for f in po_fields]
            rows.append({
                'co_label': f"CO{row.co.order}",
                'values': values,
            })
    except Exception:
        pass
    return rows


def _get_default_css() -> str:
    """Default CSS for PDF generation — professional academic style."""
    return """
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:wght@400;600;700&family=Source+Sans+3:wght@300;400;600&display=swap');

        @page {
            size: A4;
            margin: 2cm 2.5cm;
            @top-center {
                content: "COURSE SYLLABUS — " string(course-code);
                font-size: 8pt;
                color: #666;
                border-bottom: 1px solid #ddd;
                padding-bottom: 4pt;
            }
            @bottom-right {
                content: "Page " counter(page) " of " counter(pages);
                font-size: 8pt;
                color: #666;
            }
            @bottom-left {
                content: string(institution);
                font-size: 8pt;
                color: #666;
            }
        }

        * { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: 'Source Sans 3', Arial, sans-serif;
            font-size: 10pt;
            line-height: 1.6;
            color: #1a1a2e;
        }

        .doc-header {
            text-align: center;
            padding-bottom: 16pt;
            border-bottom: 3pt solid #0d1f3c;
            margin-bottom: 20pt;
        }
        .doc-header .institution { font-size: 13pt; font-weight: 600; color: #0d1f3c; }
        .doc-header .doc-title {
            font-family: 'Source Serif 4', serif;
            font-size: 18pt; font-weight: 700;
            color: #0d1f3c; margin: 6pt 0 4pt;
        }
        .doc-header .subject-id {
            font-size: 12pt; font-weight: 600; color: #e05c1a;
            letter-spacing: 0.05em;
        }

        .section {
            margin-bottom: 18pt;
            page-break-inside: avoid;
        }
        .section-title {
            font-family: 'Source Serif 4', serif;
            font-size: 11pt; font-weight: 700;
            color: #0d1f3c; background: #e8f0fb;
            padding: 5pt 10pt;
            border-left: 4pt solid #0d1f3c;
            margin-bottom: 8pt;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9.5pt;
            margin-bottom: 8pt;
        }
        th {
            background: #1b3a6b; color: white;
            padding: 5pt 8pt; text-align: center;
            font-weight: 600; font-size: 9pt;
        }
        td { padding: 4pt 8pt; border: 1pt solid #c5d0e0; }
        tr:nth-child(even) td { background: #f5f8ff; }

        .ltpsic-table th, .ltpsic-table td { text-align: center; }
        .ltpsic-table .code-cell { text-align: left; font-weight: 600; }

        .matrix-table td { text-align: center; }
        .matrix-table .co-cell {
            font-weight: 700; color: #1b3a6b;
            background: #e8f0fb !important;
        }
        .val-1 { background: #fef9c3 !important; color: #92400e; font-weight: 600; }
        .val-2 { background: #dbeafe !important; color: #1e40af; font-weight: 600; }
        .val-3 { background: #dcfce7 !important; color: #14532d; font-weight: 600; }

        .numbered-list { padding-left: 0; list-style: none; }
        .numbered-list li {
            padding: 3pt 0 3pt 20pt;
            position: relative;
            border-bottom: 0.5pt solid #eee;
        }
        .numbered-list li::before {
            position: absolute; left: 0;
            font-weight: 700; color: #1b3a6b;
        }

        .hod-review-table th { background: #1b3a6b; }
        .hod-review-table .field-col { font-weight: 600; background: #f0f5ff; width: 35%; }

        .unit-block { margin-bottom: 10pt; }
        .unit-title {
            font-weight: 700; color: #1b3a6b;
            font-size: 10pt; padding: 4pt 0;
            border-bottom: 1pt solid #c5d0e0;
            margin-bottom: 4pt;
        }

        .footer-note {
            margin-top: 24pt;
            padding-top: 8pt;
            border-top: 1pt solid #ccc;
            font-size: 8pt; color: #888;
            text-align: center;
        }

        .status-badge {
            display: inline-block;
            padding: 2pt 8pt;
            border-radius: 3pt;
            font-size: 8pt; font-weight: 700;
            text-transform: uppercase;
        }
        .status-APPROVED { background: #dcfce7; color: #14532d; }
        .status-SUBMITTED { background: #dbeafe; color: #1e40af; }
        .status-DRAFT { background: #f1f5f9; color: #475569; }
    """
