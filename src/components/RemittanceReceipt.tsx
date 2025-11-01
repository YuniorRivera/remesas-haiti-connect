import { useRef } from "react";
import * as React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Printer, Download } from "lucide-react";
import QRCode from "qrcode";
import jsPDF from "jspdf";
import { useLocale } from "@/lib/i18n";

interface RemittanceReceiptProps {
  remittance: {
    id: string;
    codigo_referencia: string;
    emisor_nombre: string;
    beneficiario_nombre: string;
    beneficiario_telefono?: string;
    principal_dop: number;
    total_client_pays_dop?: number;
    htg_to_beneficiary?: number;
    fx_client_sell?: number;
    comision_agente?: number;
    channel?: string;
    confirmed_at?: string;
    receipt_hash?: string;
  };
  agentName?: string;
}

export function RemittanceReceipt({ remittance, agentName }: RemittanceReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [qrCodeUrl, setQrCodeUrl] = React.useState<string>('');
  const { t } = useLocale();

  React.useEffect(() => {
    if (remittance.receipt_hash) {
      QRCode.toDataURL(remittance.receipt_hash, { width: 200, margin: 1 })
        .then(url => setQrCodeUrl(url))
        .catch(error => console.error('Error generating QR code:', error));
    }
  }, [remittance.receipt_hash]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    // Header - Bilingual title
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text(t('receiptTitle'), 105, 20, { align: 'center' });
    pdf.setFontSize(12);
    pdf.text(t('receiptTitleAlt'), 105, 26, { align: 'center' });
    
    // Reference code
    pdf.setFontSize(14);
    pdf.text(`Ref: ${remittance.codigo_referencia}`, 105, 35, { align: 'center' });
    
    // Date
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    const date = remittance.confirmed_at 
      ? new Date(remittance.confirmed_at).toLocaleString('es-DO')
      : new Date().toLocaleString('es-DO');
    pdf.text(`Fecha: ${date}`, 105, 42, { align: 'center' });

    // Divider
    pdf.setLineWidth(0.5);
    pdf.line(20, 48, 190, 48);

    let yPos = 58;

    // Sender info
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(t('remitter'), 20, yPos);
    yPos += 7;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(`${t('name')}: ${remittance.emisor_nombre}`, 20, yPos);
    yPos += 12;

    // Receiver info
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(t('beneficiaryHeader'), 20, yPos);
    yPos += 7;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text(`${t('name')}: ${remittance.beneficiario_nombre}`, 20, yPos);
    yPos += 5;
    if (remittance.beneficiario_telefono) {
      pdf.text(`${t('phone')}: ${remittance.beneficiario_telefono}`, 20, yPos);
      yPos += 5;
    }
    yPos += 7;

    // Divider
    pdf.line(20, yPos, 190, yPos);
    yPos += 7;

    // Transaction details
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(t('transactionDetails'), 20, yPos);
    yPos += 7;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    
    pdf.text(`${t('amountSent')}:`, 20, yPos);
    pdf.text(`$${remittance.principal_dop.toLocaleString('es-DO', { minimumFractionDigits: 2 })} DOP`, 190, yPos, { align: 'right' });
    yPos += 6;
    
    if (remittance.total_client_pays_dop) {
      pdf.text(`${t('totalPaid')}:`, 20, yPos);
      pdf.text(`$${remittance.total_client_pays_dop.toLocaleString('es-DO', { minimumFractionDigits: 2 })} DOP`, 190, yPos, { align: 'right' });
      yPos += 6;
    }
    
    if (remittance.fx_client_sell) {
      pdf.text(`${t('exchangeRateLabel')}:`, 20, yPos);
      pdf.text(`1 DOP = ${remittance.fx_client_sell.toFixed(4)} HTG`, 190, yPos, { align: 'right' });
      yPos += 6;
    }
    
    if (remittance.htg_to_beneficiary) {
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${t('beneficiarioRecibe')}:`, 20, yPos);
      pdf.text(`${remittance.htg_to_beneficiary.toLocaleString('es-DO', { minimumFractionDigits: 2 })} HTG`, 190, yPos, { align: 'right' });
      yPos += 6;
      pdf.setFont('helvetica', 'normal');
    }
    
    if (remittance.channel) {
      pdf.text(`${t('paymentChannelLabel')}:`, 20, yPos);
      pdf.text(remittance.channel, 190, yPos, { align: 'right' });
      yPos += 10;
    }

    // Official disclaimers
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text(t('officialDisclaimer'), 105, yPos, { align: 'center' });
    yPos += 5;
    pdf.text(t('officialFee'), 105, yPos, { align: 'center' });
    yPos += 10;

    // QR Code
    if (remittance.receipt_hash) {
      try {
        const qrDataUrl = await QRCode.toDataURL(remittance.receipt_hash, {
          width: 200,
          margin: 1,
        });
        pdf.addImage(qrDataUrl, 'PNG', 75, yPos, 60, 60);
        yPos += 65;
      } catch (error) {
        console.error('Error generating QR code:', error);
      }
    }

    // Footer
    pdf.setFontSize(8);
    pdf.text(t('receiptValid'), 105, yPos, { align: 'center' });
    if (agentName) {
      yPos += 5;
      pdf.text(`${t('issuedBy')}: ${agentName}`, 105, yPos, { align: 'center' });
    }

    // Save PDF
    pdf.save(`recibo-${remittance.codigo_referencia}.pdf`);
  };


  return (
    <div>
      <div className="flex gap-2 mb-4 print:hidden">
        <Button onClick={handlePrint} variant="outline" size="sm">
          <Printer className="h-4 w-4 mr-2" />
          {t('printReceipt')}
        </Button>
        <Button onClick={handleDownloadPDF} variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          {t('downloadPDF')}
        </Button>
      </div>

      <Card ref={receiptRef} className="max-w-md mx-auto print:shadow-none">
        <CardHeader className="text-center border-b">
          <h2 className="text-2xl font-bold">{t('receiptTitle')}</h2>
          <p className="text-sm font-semibold text-muted-foreground">{t('receiptTitleAlt')}</p>
          <p className="text-lg font-semibold text-primary mt-2">{remittance.codigo_referencia}</p>
          <p className="text-sm text-muted-foreground">
            {remittance.confirmed_at 
              ? new Date(remittance.confirmed_at).toLocaleString('es-DO')
              : new Date().toLocaleString('es-DO')}
          </p>
        </CardHeader>
        
        <CardContent className="space-y-6 pt-6">
          {/* Sender */}
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground mb-2">{t('remitter')}</h3>
            <p className="font-medium">{remittance.emisor_nombre}</p>
          </div>

          {/* Receiver */}
          <div>
            <h3 className="font-semibold text-sm text-muted-foreground mb-2">{t('beneficiaryHeader')}</h3>
            <p className="font-medium">{remittance.beneficiario_nombre}</p>
            {remittance.beneficiario_telefono && (
              <p className="text-sm text-muted-foreground">{remittance.beneficiario_telefono}</p>
            )}
          </div>

          {/* Transaction details */}
          <div className="border-t pt-4">
            <h3 className="font-semibold text-sm text-muted-foreground mb-3">{t('transactionDetails')}</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">{t('amountSent')}:</span>
                <span className="font-medium">
                  ${remittance.principal_dop.toLocaleString('es-DO', { minimumFractionDigits: 2 })} DOP
                </span>
              </div>
              
              {remittance.total_client_pays_dop && (
                <div className="flex justify-between">
                  <span className="text-sm">{t('totalPaid')}:</span>
                  <span className="font-medium">
                    ${remittance.total_client_pays_dop.toLocaleString('es-DO', { minimumFractionDigits: 2 })} DOP
                  </span>
                </div>
              )}
              
              {remittance.fx_client_sell && (
                <div className="flex justify-between">
                  <span className="text-sm">{t('exchangeRateLabel')}:</span>
                  <span className="font-medium">
                    1 DOP = {remittance.fx_client_sell.toFixed(4)} HTG
                  </span>
                </div>
              )}
              
              {remittance.htg_to_beneficiary && (
                <div className="flex justify-between pt-2 border-t">
                  <span className="font-semibold">{t('beneficiarioRecibe')}:</span>
                  <span className="font-bold text-primary">
                    {remittance.htg_to_beneficiary.toLocaleString('es-DO', { minimumFractionDigits: 2 })} HTG
                  </span>
                </div>
              )}
              
              {remittance.channel && (
                <div className="flex justify-between">
                  <span className="text-sm">{t('paymentChannelLabel')}:</span>
                  <span className="font-medium">{remittance.channel}</span>
                </div>
              )}
            </div>
            
            {/* Official disclaimers */}
            <div className="mt-4 pt-4 border-t text-center space-y-1">
              <p className="text-xs font-semibold text-foreground">{t('officialDisclaimer')}</p>
              <p className="text-xs font-semibold text-primary">{t('officialFee')}</p>
            </div>
          </div>

          {/* QR Code */}
          {remittance.receipt_hash && qrCodeUrl && (
            <div className="flex flex-col items-center pt-4 border-t">
              <img 
                src={qrCodeUrl} 
                alt="QR Code" 
                className="w-32 h-32"
              />
              <p className="text-xs text-muted-foreground mt-2">{t('verificationCode')}</p>
            </div>
          )}

          {/* Footer */}
          <div className="text-center pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              {t('receiptValid')}
            </p>
            {agentName && (
              <p className="text-xs text-muted-foreground mt-1">
                {t('issuedBy')}: {agentName}
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
