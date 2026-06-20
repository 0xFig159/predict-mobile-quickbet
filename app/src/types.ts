export interface ReceiptData {
  id: string;
  owner: string;
  marketKey: string;
  side: number;
  size: number;
  txDigest: string;
  status: number;
  createdAt: number;
}
