#!/usr/bin/env node
/**
 * Script per sostituire la sezione delle domande in FormCustomization.tsx
 */

const fs = require('fs');

const filePath = "protomforms-frontend/src/components/form-builder/FormCustomization.tsx";

// Leggi il file
const content = fs.readFileSync(filePath, 'utf8');
const lines = content.split('\n');

// La sezione da sostituire va dalla riga 1240 alla 1447 (indici 1239-1446 in JavaScript)
const startLine = 1239;  // indice 0-based
const endLine = 1447;    // indice 0-based (esclusivo)

// Nuovo codice da inserire
const newCode = `               
               {/* Questions - domande reali del form con navigazione paginata */}
               {questions && questions.length > 0 ? (
                 validQuestions.length > 0 && currentPreviewQuestion ? (
                   <div className="flex flex-col min-h-[400px]">
                     {/* Render della domanda corrente */}
                     <div className="flex-1 mb-6">
                       <QuestionPreviewRenderer
                         question={currentPreviewQuestion}
                         questionNumber={previewCurrentStep + 1}
                         theme={theme}
                       />
                     </div>
                     
                     {/* Bottoni di navigazione */}
                     <div className="flex justify-between items-center pt-6 border-t">
                       <Button
                         type="button"
                         variant="outline"
                         onClick={prevPreviewStep}
                         disabled={previewCurrentStep === 0}
                         style={{
                           borderColor: theme.primaryColor,
                           color: theme.textColor,
                           borderRadius: \`\${theme.borderRadius}px\`
                         }}
                         className="px-6 py-2 min-w-[120px]"
                       >
                         Precedente
                       </Button>
                       
                       <span className="text-sm text-gray-500">
                         Domanda {previewCurrentStep + 1} di {validQuestions.length}
                       </span>

                       {previewCurrentStep === validQuestions.length - 1 ? (
                         <Button
                           type="button"
                           style={{
                             backgroundColor: theme.buttonStyle === 'filled' ? theme.primaryColor : 'transparent',
                             color: theme.buttonStyle === 'filled' ? '#fff' : theme.primaryColor,
                             border: theme.buttonStyle === 'outlined' ? \`2px solid \${theme.primaryColor}\` : 'none',
                             borderRadius: \`\${theme.borderRadius}px\`
                           }}
                           className="px-6 py-2"
                         >
                           Invia Risposte
                         </Button>
                       ) : (
                         <Button
                           type="button"
                           onClick={nextPreviewStep}
                           style={{
                             backgroundColor: theme.buttonStyle === 'filled' ? theme.primaryColor : 'transparent',
                             color: theme.buttonStyle === 'filled' ? '#fff' : theme.primaryColor,
                             border: theme.buttonStyle === 'outlined' ? \`2px solid \${theme.primaryColor}\` : 'none',
                             borderRadius: \`\${theme.borderRadius}px\`
                           }}
                           className="px-6 py-2"
                         >
                           Successiva
                         </Button>
                       )}
                     </div>
                   </div>
                 ) : questions.length > 0 && validQuestions.length === 0 ? (
                   /* Mostra messaggio se le domande esistono ma non hanno testo */
                   <div className="p-6 rounded-md border-2 border-dashed border-amber-300 bg-amber-50 text-center">
                     <FileText className="h-12 w-12 text-amber-500 mx-auto mb-2" />
                     <p className="text-sm text-amber-700 font-medium">
                       {questions.length} {questions.length === 1 ? 'domanda creata' : 'domande create'}
                     </p>
                     <p className="text-xs text-amber-600 mt-1">Compila il testo delle domande per vederle qui nell'anteprima</p>
                   </div>
                 ) : (
                   /* Placeholder se qualcosa va storto */
                   <div className="p-6 rounded-md border-2 border-dashed border-gray-300 text-center">
                     <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                     <p className="text-sm text-gray-500 font-medium">Errore nel caricamento dell'anteprima</p>
                   </div>
                 )
               ) : (
                 /* Mostra placeholder se non ci sono domande */
                 <div className="p-6 rounded-md border-2 border-dashed border-gray-300 text-center">
                   <FileText className="h-12 w-12 text-gray-400 mx-auto mb-2" />
                   <p className="text-sm text-gray-500 font-medium">Nessuna domanda creata</p>
                   <p className="text-xs text-gray-400 mt-1">Aggiungi domande per vedere l'anteprima qui</p>
                 </div>
               )}
`;

// Costruisci il nuovo file
const newLines = [
  ...lines.slice(0, startLine),
  newCode,
  ...lines.slice(endLine)
];

// Scrivi il file
fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');

console.log(`✅ File modificato con successo!`);
console.log(`   Sostituite righe ${startLine+1}-${endLine} con il nuovo codice paginato`);



