'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Star, Clock, Users, BarChart3 } from 'lucide-react';

export default function FormPreviewCard() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.8, delay: 0.2 }}
      className="relative"
    >
      {/* Floating elements */}
      <motion.div
        className="absolute -top-6 -right-6 w-12 h-12 bg-[#FFCD00] rounded-full flex items-center justify-center shadow-lg z-10"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
      >
        <Star className="w-6 h-6 text-black" />
      </motion.div>
      
      <motion.div
        className="absolute -bottom-4 -left-4 w-16 h-16 bg-gradient-to-br from-[#FFCD00] to-[#FFD700] rounded-2xl flex items-center justify-center shadow-lg z-10"
        animate={{ y: [0, 10, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
      >
        <BarChart3 className="w-8 h-8 text-black" />
      </motion.div>

      {/* Main Card */}
      <Card className="w-full max-w-md mx-auto bg-white shadow-2xl border-0 overflow-hidden">
        {/* Header */}
        <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Survey Soddisfazione</h3>
              <p className="text-sm text-gray-600">Team HR - Q4 2024</p>
            </div>
            <Badge className="bg-[#FFCD00] text-black hover:bg-[#FFD700]">
              Attivo
            </Badge>
          </div>
          
          {/* Stats */}
          <div className="flex items-center gap-4 mt-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              5 min
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-3 h-3" />
              127 risposte
            </div>
            <div className="flex items-center gap-1">
              <BarChart3 className="w-3 h-3" />
              94% completato
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Question 1 */}
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <span className="w-6 h-6 bg-[#FFCD00] text-black rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                1
              </span>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 text-sm">
                  Come valuti l'ambiente di lavoro?
                </h4>
                <p className="text-xs text-gray-500 mt-1">Obbligatorio</p>
              </div>
            </div>
            
            <RadioGroup defaultValue="4" className="ml-8 space-y-2">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="5" id="r5" className="border-[#FFCD00] text-[#FFCD00]" />
                <Label htmlFor="r5" className="text-sm text-gray-700">Eccellente</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="4" id="r4" className="border-[#FFCD00] text-[#FFCD00]" />
                <Label htmlFor="r4" className="text-sm text-gray-700">Buono</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="3" id="r3" className="border-[#FFCD00] text-[#FFCD00]" />
                <Label htmlFor="r3" className="text-sm text-gray-700">Sufficiente</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="2" id="r2" className="border-[#FFCD00] text-[#FFCD00]" />
                <Label htmlFor="r2" className="text-sm text-gray-700">Scarso</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Question 2 */}
          <div className="space-y-3">
            <div className="flex items-start gap-2">
              <span className="w-6 h-6 bg-[#FFCD00] text-black rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                2
              </span>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 text-sm">
                  Suggerimenti per migliorare?
                </h4>
                <p className="text-xs text-gray-500 mt-1">Opzionale</p>
              </div>
            </div>
            
            <div className="ml-8">
              <Textarea 
                placeholder="Scrivi qui i tuoi suggerimenti..."
                className="text-sm resize-none h-20 border-gray-200 focus:border-[#FFCD00] focus:ring-[#FFCD00]"
                defaultValue="Maggiore flessibilità negli orari di lavoro..."
              />
            </div>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs text-gray-500">
              <span>Progresso</span>
              <span>2 di 5</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div 
                className="bg-gradient-to-r from-[#FFCD00] to-[#FFD700] h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: "40%" }}
                transition={{ duration: 1.5, delay: 0.5 }}
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1 border-gray-200 hover:border-[#FFCD00] hover:text-[#FFCD00]"
            >
              Indietro
            </Button>
            <Button 
              size="sm" 
              className="flex-1 bg-gradient-to-r from-[#FFCD00] to-[#FFD700] hover:from-[#FFD700] hover:to-[#FFCD00] text-black font-medium"
            >
              Avanti
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#FFCD00]/20 to-[#FFD700]/20 rounded-3xl blur-3xl -z-10 scale-110"></div>
    </motion.div>
  );
} 