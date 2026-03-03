import { RetroRoom } from "@/shared/retro";
import { CheckCircle, Download, FileText } from "lucide-react";

interface Props {
  room: RetroRoom;
}

export function RetroDoneStage({ room }: Props) {
  const handleExport = () => {
    const markdown = `# Retro Export: ${room.template}
Date: ${new Date().toLocaleDateString()}

## Action Points
${room.actionPoints.map(a => `- [${a.status === 'done' ? 'x' : ' '}] ${a.description} (Owner: ${a.owner || 'Unassigned'}, Due: ${a.dueDate || 'None'})`).join('\n')}

## Cards
${room.cards.map(c => `- [${c.column}] ${c.text}`).join('\n')}
`;
    const blob = new Blob([markdown], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `retro-${room.id}.md`;
    a.click();
  };

  return (
    <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto w-full text-center">
      <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-8">
        <CheckCircle className="w-12 h-12" />
      </div>
      
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Retro Completed!</h2>
      <p className="text-gray-500 text-lg mb-12">
        Great job team. The retrospective has been concluded and the data is now read-only.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">Summary</h3>
          <p className="text-gray-500 text-sm mb-4">
            {room.cards.length} cards created<br/>
            {room.actionPoints.length} action points generated
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center">
          <button 
            onClick={handleExport}
            className="w-full py-3 bg-gray-900 text-white font-medium rounded-xl hover:bg-gray-800 transition-colors shadow-sm flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            Export Markdown
          </button>
          <p className="text-gray-400 text-xs mt-4">
            Download the full retro data for your records.
          </p>
        </div>
      </div>
    </div>
  );
}
