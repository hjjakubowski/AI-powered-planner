import { useCallback, useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';
import ChatWidget from '../components/ChatWidget';

const initialColumns = {
  overdue: { title: 'Zaległe', items: [] },
  todo: { title: 'Do zrobienia', items: [] },
  inProgress: { title: 'W trakcie', items: [] },
  done: { title: 'Gotowe', items: [] }
};

const KanbanBoardPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);

  const [columns, setColumns] = useState(initialColumns);
  const [task, setTask] = useState(null);
  const [newItemText, setNewItemText] = useState('');
  const [loading, setLoading] = useState(true);

  // Zmienna do obsługi przeciagania
  const [draggingItem, setDraggingItem] = useState(null);

  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const fetchTaskAndBoard = useCallback(async () => {
    try {
      // Zakładamy, że pobranie pojedynczego zadania po id polega na zmapowaniu całej listy
      // (ponieważ API /tasks/:id mogło nie zostać zoptymalizowane do GET, ale najpewniej /tasks pobiera listę)
      const res = await api.get('/tasks');
      const currentTask = res.data.find(t => t.id === parseInt(id));

      if (!currentTask) {
        navigate('/');
        return;
      }
      setTask(currentTask);

      if (currentTask.kanbanState) {
        setColumns(JSON.parse(currentTask.kanbanState));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchTaskAndBoard();
  }, [fetchTaskAndBoard]);

  const saveBoard = async (newColumns) => {
    if (!task) return;
    setColumns(newColumns);
    try {
      await api.put(`/tasks/${task.id}`, {
        title: task.title,
        description: task.description,
        dueDate: task.dueDate,
        kanbanState: JSON.stringify(newColumns)
      });
    } catch (err) {
      console.error('Błąd zapisywania tablicy kanban', err);
    }
  };

  const handleDragStart = (e, item, sourceColumnId) => {
    setDraggingItem({ item, sourceColumnId });
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e) => {
    e.preventDefault(); // Niezbędne żeby allowDrop działało
  };

  const handleDrop = (e, destColumnId) => {
    e.preventDefault();
    if (!draggingItem) return;

    const { item, sourceColumnId } = draggingItem;
    if (sourceColumnId === destColumnId) {
      setDraggingItem(null);
      return;
    }

    const sourceCol = columns[sourceColumnId];
    const destCol = columns[destColumnId];

    const sourceItems = [...sourceCol.items];
    const destItems = [...destCol.items];

    // Usuń z kolumny źródłowej
    const index = sourceItems.findIndex(i => i.id === item.id);
    sourceItems.splice(index, 1);

    // Dodaj do kolumny docelowej
    destItems.push(item);

    const newColumns = {
      ...columns,
      [sourceColumnId]: {
        ...sourceCol,
        items: sourceItems
      },
      [destColumnId]: {
        ...destCol,
        items: destItems
      }
    };

    saveBoard(newColumns);
    setDraggingItem(null);
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    if (!newItemText.trim()) return;

    const newItem = { id: Date.now().toString(), text: newItemText };
    const newColumns = { ...columns };
    newColumns.todo.items.push(newItem);

    saveBoard(newColumns);
    setNewItemText('');
  };

  const handleDeleteItem = (colId, itemId) => {
    const colItems = columns[colId].items.filter(i => i.id !== itemId);
    const newColumns = {
      ...columns,
      [colId]: {
        ...columns[colId],
        items: colItems
      }
    };
    saveBoard(newColumns);
  };

  if (loading) return <div className="p-8 text-center">Ładowanie...</div>;

  const userInitials = user?.username ? user.username.substring(0, 2).toUpperCase() : 'U';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col px-6 pt-24 pb-8 relative">
      <div className="fixed top-8 right-8 z-50">
        <button
          onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
          className="w-16 h-16 rounded-full bg-blue-600 text-white font-bold text-xl flex items-center justify-center hover:bg-blue-700 transition focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-md cursor-pointer"
        >
          {userInitials}
        </button>

        {isProfileMenuOpen && (
          <div className="absolute top-20 right-0 bg-white border border-gray-200 rounded-lg shadow-xl py-2 w-48 animate-fade-in-down">
            <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 transition cursor-pointer">Zarządzaj profilem</button>
            <button className="w-full text-left px-4 py-2 hover:bg-gray-100 text-gray-700 transition cursor-pointer">Konto</button>
            <div className="border-t border-gray-100 my-1"></div>
            <button
              onClick={logout}
              className="w-full text-left px-4 py-2 hover:bg-gray-100 text-red-600 transition font-medium cursor-pointer"
            >
              Wyloguj się
            </button>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between mb-8 max-w-7xl mx-auto w-full">
        <div>
          <button
            onClick={() => navigate('/')}
            className="text-blue-600 hover:text-blue-800 font-medium mb-2 flex items-center"
          >
            ← Wróć do kalendarza
          </button>
          <h1 className="text-3xl font-bold text-gray-800">
            Tablica Kanban: <span className="text-blue-600">{task?.title}</span>
          </h1>
        </div>

        <form onSubmit={handleAddItem} className="flex gap-2">
          <input
            type="text"
            className="border border-gray-300 px-4 py-2 rounded shadow-sm outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Nowe zadanie..."
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
          />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 shadow font-medium">
            Dodaj kafelek
          </button>
        </form>
      </div>

      <div className="flex gap-6 max-w-7xl mx-auto w-full overflow-x-auto pb-4 h-full flex-1">
        {Object.entries(columns).map(([colId, column]) => (
          <div
            key={colId}
            className="bg-gray-100 rounded-lg flex flex-col flex-1 min-w-[250px] shadow border border-gray-200"
            onDragOver={handleDragOver}
            onDrop={(e) => handleDrop(e, colId)}
          >
            <div className="p-4 font-bold text-gray-700 border-b border-gray-200 bg-white rounded-t-lg flex justify-between items-center">
              <span>{column.title}</span>
              <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded-full">{column.items.length}</span>
            </div>

            <div className="p-3 flex-1 flex flex-col gap-3 min-h-[150px]">
              {column.items.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, item, colId)}
                  className="bg-white p-4 rounded shadow-sm border border-gray-200 cursor-move hover:shadow-md transition active:scale-95 flex justify-between items-start group"
                >
                  <span className="text-gray-800 break-words">{item.text}</span>
                  <button
                    onClick={() => handleDeleteItem(colId, item.id)}
                    className="text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition px-1"
                    title="Usuń"
                  >
                    ×
                  </button>
                </div>
              ))}
              {column.items.length === 0 && (
                <div className="text-gray-400 text-sm text-center py-4 border-2 border-dashed border-gray-200 rounded">
                  Przeciągnij tutaj
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      <ChatWidget />
    </div>
  );
};

export default KanbanBoardPage;
