'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';

interface AnimatedTableProps {
  headers: ReactNode[];
  rows: ReactNode[][];
  className?: string;
  staggerDelay?: number;
  containerClassName?: string;
}

export function AnimatedTable({ 
  headers, 
  rows, 
  className = '', 
  staggerDelay = 0.05,
  containerClassName = ''
}: AnimatedTableProps) {
  const container = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: staggerDelay,
        delayChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1]
      }
    }
  };

  return (
    <motion.div
      className={containerClassName}
      variants={container}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
    >
      <Table className={className}>
        <TableHeader>
          <TableRow>
            {headers.map((header, index) => (
              <motion.th 
                key={index} 
                variants={item}
                className="bg-gray-50"
              >
                {header}
              </motion.th>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, rowIndex) => (
            <motion.tr 
              key={rowIndex} 
              variants={item}
              whileHover={{ backgroundColor: "rgba(0, 0, 0, 0.02)" }}
              transition={{ duration: 0.2 }}
            >
              {row.map((cell, cellIndex) => (
                <TableCell key={cellIndex}>
                  {cell}
                </TableCell>
              ))}
            </motion.tr>
          ))}
        </TableBody>
      </Table>
    </motion.div>
  );
} 