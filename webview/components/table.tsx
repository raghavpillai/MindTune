"use client";

import React, { useState } from "react";
import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  getKeyValue,
  Modal,
  ModalBody,
  ModalFooter,
  Button,
  ModalContent,
  useDisclosure,
  ModalHeader,
  Divider,
  Card,
} from "@nextui-org/react";
import NewChart from "@/components/chart";

interface Row {
  key: string;
  user_id: string;
  first_name: string;
  last_name: string;
  age: number;
  city: string;
  phone: string;
  score: number;
}

const rows: Row[] = [
  {
    key: "1",
    user_id: "U001",
    first_name: "Tony",
    last_name: "Reichert",
    age: 45,
    city: "New York",
    phone: "123-456-7890",
    score: 98,
  },
  {
    key: "2",
    user_id: "U002",
    first_name: "Zoey",
    last_name: "Lang",
    age: 32,
    city: "Los Angeles",
    phone: "987-654-3210",
    score: 90,
  },
  {
    key: "3",
    user_id: "U003",
    first_name: "Jane",
    last_name: "Fisher",
    age: 29,
    city: "San Francisco",
    phone: "456-789-0123",
    score: 95,
  },
  {
    key: "4",
    user_id: "U004",
    first_name: "William",
    last_name: "Howard",
    age: 40,
    city: "Chicago",
    phone: "789-012-3456",
    score: 85,
  },
];

interface Column {
  key: keyof Row;
  label: string;
}

const columns: Column[] = [
  { key: "user_id", label: "User ID" },
  { key: "first_name", label: "First Name" },
  { key: "last_name", label: "Last Name" },
  { key: "age", label: "Age" },
  { key: "city", label: "City" },
  { key: "phone", label: "Phone" },
  { key: "score", label: "Score" },
];

export default function App() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const [currentItem, setCurrentItem] = React.useState<Row | null>(null);
  const [rows, setRows] = React.useState<Row[]>([]);

  React.useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch('http://localhost:8080/api/v1/users/get_all_data');
        const data = await response.json();
        if (data.success && data.message && data.message.user_data) {
          // Transform the data to match the Row interface
          const formattedData = data.message.user_data.map((user: any, index: number) => ({
            key: (index + 1).toString(),
            user_id: user.user_id,
            first_name: user.first_name,
            last_name: user.last_name,
            age: user.age,
            city: user.city,
            phone: user.phone,
            score: user.score,
            score_history: user.score_history,
          }));
          setRows(formattedData);
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      }
    };

    fetchData();
  }, []);

  const [videoSrc, setVideoSrc] = useState('');

  const fetchVideo = async (name: string) => {
    try {
      const response = await fetch(`https://shreyj1729--mind-tune-dir-gaze-video-dev.modal.run/?user_id=${name}`);     
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);

      setVideoSrc(blobUrl);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const renderCell = (item: Row, columnKey: keyof Row) => {
    const cellValue = getKeyValue(item, columnKey);

    if (columnKey === "score") {
      let bgColorClass;
      // Determine the background color class based on the score range
      if (cellValue < 80) {
        bgColorClass = 'bg-red-500'; // Red for low scores
      } else if (cellValue < 90) {
        bgColorClass = 'bg-yellow-500'; // Yellow for medium scores
      } else {
        bgColorClass = 'bg-green-500'; // Green for high scores
      }
      return (
        <>
          <Button onPress={() => {
              setCurrentItem(item); // Update the currentItem
              fetchVideo(item.user_id);
              onOpen();
            }}
            className={`text-white ${bgColorClass}`}
            >{cellValue}</Button>
        </>
      );
    }
    return cellValue;
  };

  return (
    <>
      <Table aria-label="Example table with dynamic content">
        <TableHeader columns={columns}>
          {(column: Column) => (
            <TableColumn key={column.key}>{column.label}</TableColumn>
          )}
        </TableHeader>
        <TableBody items={rows}>
          {(item: Row) => (
            <TableRow key={item.key}>
              {(columnKey: keyof Row) => (
                <TableCell>{renderCell(item, columnKey)}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Modal isOpen={isOpen} onClose={onClose} size="2xl">
        <ModalContent >
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                {currentItem ? 
                  `Score report and eye tracking footage for ${currentItem.first_name} ${currentItem.last_name}` 
                  : 'Score Report'
                }
              </ModalHeader>
              <ModalBody style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                {currentItem && <NewChart scoreHistory={currentItem.score_history}/>}
                <Divider orientation="vertical"></Divider>
                { currentItem &&
                <Card radius="none" style={{ textAlign: 'center' }}>
                  {`Eye tracking footage for ${currentItem.first_name} ${currentItem.last_name}` }
                  <video
                    width="560"
                    height="315"
                    src={videoSrc}
                  ></video>
                </Card>}
              </ModalBody>
              <ModalFooter>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  );
}