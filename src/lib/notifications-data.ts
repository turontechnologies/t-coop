export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
}

export const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: "n1",
    title: "Loan disbursed",
    description: "₦50,000 was disbursed to Turon Co-operative.",
    time: "2 hours ago",
    read: false,
  },
  {
    id: "n2",
    title: "New member joined",
    description: "Yomidun Co-operative added a new member.",
    time: "5 hours ago",
    read: false,
  },
  {
    id: "n3",
    title: "Dividend payout scheduled",
    description: "John Snow and Sons will receive ₦150,000 on payout day.",
    time: "1 day ago",
    read: false,
  },
  {
    id: "n4",
    title: "Savings contribution received",
    description: "₦350,000 was received from Turon Co-operative.",
    time: "2 days ago",
    read: true,
  },
];
