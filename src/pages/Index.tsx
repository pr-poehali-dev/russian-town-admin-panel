import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import Icon from '@/components/ui/icon';
import { toast } from 'sonner';
import { api } from '@/lib/api';

type UserRole = 'user' | 'admin_junior' | 'admin' | 'admin_senior' | 'owner';
type FactionType = 'open' | 'closed' | 'criminal';

interface User {
  id: number;
  username: string;
  role: UserRole;
  faction?: string;
  custom_role?: string;
  status?: string;
  avatar?: string;
  is_banned?: boolean;
  is_muted?: boolean;
}

interface Post {
  id: number;
  author: string;
  title: string;
  content: string;
  created_at: string;
  author_avatar?: string;
}

interface Faction {
  name: string;
  type: FactionType;
  general?: string;
  description: string;
}

const factions: Faction[] = [
  { name: 'МВД', type: 'open', description: 'Министерство внутренних дел' },
  { name: 'СОБР', type: 'open', description: 'Специальный отряд быстрого реагирования' },
  { name: 'ДПС', type: 'open', description: 'Дорожно-патрульная служба' },
  { name: 'Росгвардия', type: 'open', description: 'Федеральная служба войск национальной гвардии' },
  { name: 'ЦОДД', type: 'open', general: 'Турист-вагнера', description: 'Центр организации дорожного движения' },
  { name: 'Армия', type: 'open', general: 'Pancake', description: 'Вооруженные силы' },
  { name: 'Полиция', type: 'open', general: 'Cailon86', description: 'Полиция города' },
  { name: 'ССО', type: 'closed', description: 'Силы специальных операций' },
  { name: 'СБП', type: 'closed', description: 'Служба безопасности президента' },
  { name: 'ФСБ', type: 'closed', description: 'Федеральная служба безопасности' },
  { name: 'ФСО', type: 'closed', description: 'Федеральная служба охраны' },
  { name: 'ОПГ Темного', type: 'criminal', description: 'Организованная преступная группировка' },
  { name: 'ОПГ Красное', type: 'criminal', description: 'Криминальная структура' },
  { name: 'Тамбовское ОПГ', type: 'criminal', description: 'Преступная организация' },
];

const admins = [
  { name: 'Pancake', role: 'Старший администратор' },
  { name: 'Cj', role: 'Младший администратор' },
  { name: 'gotnevl', role: 'Администратор' },
];

const Index = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const [loginForm, setLoginForm] = useState({ username: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ username: '', password: '', confirmPassword: '' });
  const [newPost, setNewPost] = useState({ title: '', content: '' });
  const [adminCode, setAdminCode] = useState('99797');
  const [adminCodeInput, setAdminCodeInput] = useState('');
  const [newAvatarUrl, setNewAvatarUrl] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, postsData] = await Promise.all([api.getUsers(), api.getPosts()]);
      setUsers(usersData);
      setPosts(postsData);
    } catch (error) {
      toast.error('Ошибка загрузки данных');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    try {
      const user = await api.login(loginForm.username, loginForm.password);
      setCurrentUser(user);
      toast.success(`Добро пожаловать, ${user.username}!`);
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка входа');
    }
  };

  const handleRegister = async () => {
    if (registerForm.password !== registerForm.confirmPassword) {
      toast.error('Пароли не совпадают');
      return;
    }
    try {
      await api.register(registerForm.username, registerForm.password, adminCodeInput || undefined);
      toast.success('Регистрация успешна! Теперь вы можете войти.');
      setIsLoginMode(true);
      setRegisterForm({ username: '', password: '', confirmPassword: '' });
      setAdminCodeInput('');
      await loadData();
    } catch (error: any) {
      toast.error(error.message || 'Ошибка регистрации');
    }
  };

  const handleCreatePost = async () => {
    if (!currentUser) return;
    try {
      await api.createPost(currentUser.id, newPost.title, newPost.content);
      setNewPost({ title: '', content: '' });
      toast.success('Пост создан!');
      await loadData();
    } catch (error) {
      toast.error('Ошибка создания поста');
    }
  };

  const handleBanUser = async (userId: number) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    try {
      await api.banUser(userId, !user.is_banned);
      toast.success('Статус пользователя изменен');
      await loadData();
    } catch (error) {
      toast.error('Ошибка изменения статуса');
    }
  };

  const handleMuteUser = async (userId: number) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;
    try {
      await api.muteUser(userId, !user.is_muted);
      toast.success('Статус мута изменен');
      await loadData();
    } catch (error) {
      toast.error('Ошибка изменения статуса мута');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      await api.deleteUser(userId);
      toast.success('Пользователь заблокирован');
      await loadData();
    } catch (error) {
      toast.error('Ошибка удаления пользователя');
    }
  };

  const handleAssignRole = async (userId: number, role: UserRole) => {
    try {
      await api.updateRole(userId, role);
      toast.success('Роль назначена');
      await loadData();
    } catch (error) {
      toast.error('Ошибка назначения роли');
    }
  };

  const handleAssignFaction = async (userId: number, faction: string) => {
    try {
      await api.updateFaction(userId, faction);
      toast.success('Фракция назначена');
      await loadData();
    } catch (error) {
      toast.error('Ошибка назначения фракции');
    }
  };

  const handleUpdateAvatar = async () => {
    if (!currentUser || !newAvatarUrl) return;
    try {
      await api.updateAvatar(currentUser.id, newAvatarUrl);
      setCurrentUser({ ...currentUser, avatar: newAvatarUrl });
      setNewAvatarUrl('');
      toast.success('Аватар обновлен!');
      await loadData();
    } catch (error) {
      toast.error('Ошибка обновления аватара');
    }
  };

  const canAccessAdminPanel = currentUser && ['admin_junior', 'admin', 'admin_senior', 'owner'].includes(currentUser.role);
  const isOwner = currentUser?.role === 'owner';

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Icon name="Loader2" size={48} className="animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-background/80 p-4">
        <Card className="w-full max-w-md p-8 backdrop-blur-sm bg-card/50 border-border/50 shadow-2xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Russian Town
            </h1>
            <p className="text-muted-foreground">Brick Rigs Community</p>
            <a
              href="https://discord.gg/RuBxnxyEV5"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-4 text-primary hover:text-primary/80 transition-colors"
            >
              <Icon name="MessageSquare" size={20} />
              <span>Присоединиться к Discord</span>
            </a>
          </div>

          <Tabs value={isLoginMode ? 'login' : 'register'} onValueChange={(v) => setIsLoginMode(v === 'login')}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Вход</TabsTrigger>
              <TabsTrigger value="register">Регистрация</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <div>
                <Label htmlFor="login-username">Имя пользователя</Label>
                <Input
                  id="login-username"
                  value={loginForm.username}
                  onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })}
                  placeholder="Введите имя"
                />
              </div>
              <div>
                <Label htmlFor="login-password">Пароль</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="Введите пароль"
                />
              </div>
              {loginForm.username !== 'TOURIST_WAGNERA' && (
                <div>
                  <Label htmlFor="admin-code">Админ-код (если вы администратор)</Label>
                  <Input
                    id="admin-code"
                    type="password"
                    value={adminCodeInput}
                    onChange={(e) => setAdminCodeInput(e.target.value)}
                    placeholder="Введите админ-код"
                  />
                </div>
              )}
              <Button onClick={handleLogin} className="w-full">
                Войти
              </Button>
            </TabsContent>

            <TabsContent value="register" className="space-y-4">
              <div>
                <Label htmlFor="register-username">Имя пользователя</Label>
                <Input
                  id="register-username"
                  value={registerForm.username}
                  onChange={(e) => setRegisterForm({ ...registerForm, username: e.target.value })}
                  placeholder="Введите имя"
                />
              </div>
              <div>
                <Label htmlFor="register-password">Пароль</Label>
                <Input
                  id="register-password"
                  type="password"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                  placeholder="Введите пароль"
                />
              </div>
              <div>
                <Label htmlFor="register-confirm">Подтвердите пароль</Label>
                <Input
                  id="register-confirm"
                  type="password"
                  value={registerForm.confirmPassword}
                  onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                  placeholder="Повторите пароль"
                />
              </div>
              <Button onClick={handleRegister} className="w-full">
                Зарегистрироваться
              </Button>
            </TabsContent>
          </Tabs>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 backdrop-blur-sm bg-card/30 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Russian Town
              </h1>
              <p className="text-sm text-muted-foreground">Brick Rigs Community Server</p>
            </div>
            <div className="flex items-center gap-4">
              <a
                href="https://discord.gg/RuBxnxyEV5"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 transition-colors"
              >
                <Icon name="MessageSquare" size={24} />
              </a>
              <Dialog>
                <DialogTrigger asChild>
                  <button className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                    <Avatar>
                      <AvatarImage src={currentUser.avatar} />
                      <AvatarFallback>{currentUser.username[0]}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{currentUser.username}</span>
                  </button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Профиль</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="flex justify-center">
                      <Avatar className="w-24 h-24">
                        <AvatarImage src={currentUser.avatar} />
                        <AvatarFallback>{currentUser.username[0]}</AvatarFallback>
                      </Avatar>
                    </div>
                    <div>
                      <Label>Изменить аватар</Label>
                      <div className="flex gap-2">
                        <Input
                          value={newAvatarUrl}
                          onChange={(e) => setNewAvatarUrl(e.target.value)}
                          placeholder="Вставьте URL изображения"
                        />
                        <Button onClick={handleUpdateAvatar} size="sm">
                          <Icon name="Check" size={16} />
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Можно использовать любое изображение из интернета
                      </p>
                    </div>
                    <Separator />
                    <div>
                      <Label>Имя пользователя</Label>
                      <Input value={currentUser.username} disabled />
                    </div>
                    <div>
                      <Label>Роль</Label>
                      <Input value={currentUser.role} disabled />
                    </div>
                    {currentUser.faction && (
                      <div>
                        <Label>Фракция</Label>
                        <Input value={currentUser.faction} disabled />
                      </div>
                    )}
                    {currentUser.custom_role && (
                      <div>
                        <Label>Кастомная роль</Label>
                        <Input value={currentUser.custom_role} disabled />
                      </div>
                    )}
                    {currentUser.status && (
                      <div>
                        <Label>Статус</Label>
                        <Input value={currentUser.status} disabled />
                      </div>
                    )}
                    <Button onClick={() => setCurrentUser(null)} variant="destructive" className="w-full">
                      Выйти
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Tabs defaultValue="home" className="space-y-6">
          <TabsList className="flex flex-wrap gap-2 h-auto bg-card/50 p-2">
            <TabsTrigger value="home" className="flex items-center gap-2">
              <Icon name="Home" size={16} />
              Главная
            </TabsTrigger>
            <TabsTrigger value="forum" className="flex items-center gap-2">
              <Icon name="MessageSquare" size={16} />
              Форум
            </TabsTrigger>
            <TabsTrigger value="factions" className="flex items-center gap-2">
              <Icon name="Shield" size={16} />
              Фракции
            </TabsTrigger>
            <TabsTrigger value="administration" className="flex items-center gap-2">
              <Icon name="Users" size={16} />
              Администрация
            </TabsTrigger>
            <TabsTrigger value="profiles" className="flex items-center gap-2">
              <Icon name="User" size={16} />
              Профили
            </TabsTrigger>
            <TabsTrigger value="rules" className="flex items-center gap-2">
              <Icon name="BookOpen" size={16} />
              Правила
            </TabsTrigger>
            {canAccessAdminPanel && (
              <TabsTrigger value="admin" className="flex items-center gap-2 bg-destructive/20">
                <Icon name="Settings" size={16} />
                Admin Panel
              </TabsTrigger>
            )}
            {isOwner && (
              <TabsTrigger value="owner" className="flex items-center gap-2 bg-accent/20">
                <Icon name="Crown" size={16} />
                Owner Panel
              </TabsTrigger>
            )}
          </TabsList>

          <TabsContent value="home" className="space-y-6">
            <Card className="p-6 bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 border-primary/20">
              <h2 className="text-3xl font-bold mb-4">Добро пожаловать на Russian Town!</h2>
              <p className="text-lg text-muted-foreground mb-4">
                Официальный сайт сервера Brick Rigs. Присоединяйтесь к нашему сообществу!
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <Card className="p-4 bg-card/50">
                  <Icon name="Users" size={32} className="text-primary mb-2" />
                  <h3 className="font-bold">Активное сообщество</h3>
                  <p className="text-sm text-muted-foreground">Присоединяйтесь к игрокам</p>
                </Card>
                <Card className="p-4 bg-card/50">
                  <Icon name="Shield" size={32} className="text-secondary mb-2" />
                  <h3 className="font-bold">Множество фракций</h3>
                  <p className="text-sm text-muted-foreground">Выберите свой путь</p>
                </Card>
                <Card className="p-4 bg-card/50">
                  <Icon name="Trophy" size={32} className="text-accent mb-2" />
                  <h3 className="font-bold">Рейтинговая система</h3>
                  <p className="text-sm text-muted-foreground">Соревнуйтесь с другими</p>
                </Card>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="forum" className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Форум</h2>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                      <Icon name="Plus" size={16} className="mr-2" />
                      Создать пост
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Новый пост</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>Заголовок</Label>
                        <Input
                          value={newPost.title}
                          onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                          placeholder="Введите заголовок"
                        />
                      </div>
                      <div>
                        <Label>Содержание</Label>
                        <Textarea
                          value={newPost.content}
                          onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                          placeholder="Введите текст поста"
                          rows={6}
                        />
                      </div>
                      <Button onClick={handleCreatePost} className="w-full">
                        Опубликовать
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-4">
                {posts.map((post) => (
                  <Card key={post.id} className="p-4 hover:border-primary/50 transition-colors">
                    <div className="flex items-start gap-4">
                      <Avatar>
                        <AvatarImage src={post.author_avatar} />
                        <AvatarFallback>{post.author[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold">{post.author}</span>
                          <span className="text-sm text-muted-foreground">
                            {new Date(post.created_at).toLocaleDateString('ru-RU')}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold mb-2">{post.title}</h3>
                        <p className="text-muted-foreground">{post.content}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="factions" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Icon name="Shield" size={24} className="text-primary" />
                  Открытые фракции
                </h3>
                <div className="space-y-2">
                  {factions.filter(f => f.type === 'open').map((faction) => (
                    <div key={faction.name} className="p-3 bg-muted/50 rounded-lg">
                      <div className="font-bold">{faction.name}</div>
                      {faction.general && (
                        <Badge variant="secondary" className="mt-1">
                          Генерал: {faction.general}
                        </Badge>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">{faction.description}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Icon name="Lock" size={24} className="text-secondary" />
                  Закрытые фракции
                </h3>
                <div className="space-y-2">
                  {factions.filter(f => f.type === 'closed').map((faction) => (
                    <div key={faction.name} className="p-3 bg-muted/50 rounded-lg">
                      <div className="font-bold">{faction.name}</div>
                      <p className="text-sm text-muted-foreground mt-1">{faction.description}</p>
                    </div>
                  ))}
                </div>
              </Card>

              <Card className="p-6">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  <Icon name="Skull" size={24} className="text-accent" />
                  Криминальные структуры
                </h3>
                <div className="space-y-2">
                  {factions.filter(f => f.type === 'criminal').map((faction) => (
                    <div key={faction.name} className="p-3 bg-muted/50 rounded-lg">
                      <div className="font-bold">{faction.name}</div>
                      <p className="text-sm text-muted-foreground mt-1">{faction.description}</p>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="administration" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Icon name="Shield" size={28} className="text-primary" />
                Команда администрации
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {admins.map((admin) => (
                  <Card key={admin.name} className="p-4 bg-gradient-to-br from-primary/5 to-secondary/5">
                    <div className="flex items-center gap-3 mb-2">
                      <Avatar>
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${admin.name}`} />
                        <AvatarFallback>{admin.name[0]}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-bold">{admin.name}</div>
                        <Badge variant="secondary">{admin.role}</Badge>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="profiles" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Профили пользователей</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {users.map((user) => (
                  <Card key={user.id} className="p-4 hover:border-primary/50 transition-colors">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar>
                        <AvatarImage src={user.avatar} />
                        <AvatarFallback>{user.username[0]}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="font-bold">{user.username}</div>
                        <Badge variant="outline">{user.role}</Badge>
                      </div>
                    </div>
                    {user.faction && (
                      <div className="text-sm text-muted-foreground mb-1">
                        <Icon name="Shield" size={14} className="inline mr-1" />
                        {user.faction}
                      </div>
                    )}
                    {user.isBanned && (
                      <Badge variant="destructive" className="mt-2">
                        Заблокирован
                      </Badge>
                    )}
                  </Card>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="rules" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-2xl font-bold mb-6">Правила сервера</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-bold mb-2">1. Общие правила</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Уважайте других игроков</li>
                    <li>Запрещено использование читов и багов</li>
                    <li>Следуйте указаниям администрации</li>
                  </ul>
                </div>
                <Separator />
                <div>
                  <h3 className="text-xl font-bold mb-2">2. Правила фракций</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Следуйте иерархии фракции</li>
                    <li>Выполняйте приказы генералов</li>
                    <li>Соблюдайте дресс-код фракции</li>
                  </ul>
                </div>
                <Separator />
                <div>
                  <h3 className="text-xl font-bold mb-2">3. Наказания</h3>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Предупреждение - первое нарушение</li>
                    <li>Мут - повторные нарушения</li>
                    <li>Бан - серьезные нарушения</li>
                  </ul>
                </div>
              </div>
            </Card>
          </TabsContent>

          {canAccessAdminPanel && (
            <TabsContent value="admin" className="space-y-6">
              <Card className="p-6 border-destructive/50">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Icon name="Settings" size={28} className="text-destructive" />
                  Панель администратора
                </h2>
                <p className="text-muted-foreground mb-4">
                  Доступ к модерации пользователей: бан и мут
                </p>
                <div className="space-y-4">
                  {users.filter(u => u.id !== currentUser.id && u.role !== 'owner').map((user) => (
                    <Card key={user.id} className="p-4 bg-muted/30">
                      <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>{user.username[0]}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-bold">{user.username}</div>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline">{user.role}</Badge>
                              {user.is_banned && <Badge variant="destructive">Забанен</Badge>}
                              {user.is_muted && <Badge variant="secondary">Замучен</Badge>}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-wrap">
                          <Button
                            size="sm"
                            variant={user.is_banned ? 'outline' : 'destructive'}
                            onClick={() => handleBanUser(user.id)}
                          >
                            <Icon name="Ban" size={14} className="mr-1" />
                            {user.is_banned ? 'Разбанить' : 'Забанить'}
                          </Button>
                          <Button
                            size="sm"
                            variant={user.is_muted ? 'outline' : 'secondary'}
                            onClick={() => handleMuteUser(user.id)}
                          >
                            <Icon name="VolumeX" size={14} className="mr-1" />
                            {user.is_muted ? 'Размутить' : 'Замутить'}
                          </Button>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            </TabsContent>
          )}

          {isOwner && (
            <TabsContent value="owner" className="space-y-6">
              <Card className="p-6 border-accent/50">
                <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                  <Icon name="Crown" size={28} className="text-accent" />
                  Owner Panel
                </h2>

                <div className="space-y-6">
                  <Card className="p-4 bg-accent/5">
                    <h3 className="font-bold mb-4">Полное управление пользователями</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Назначение администраторов, фракций, модерация и удаление
                    </p>
                    <div className="space-y-4">
                      {users.filter(u => u.id !== currentUser.id).map((user) => (
                        <Card key={user.id} className="p-4 bg-muted/20">
                          <div className="space-y-4">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                              <div className="flex items-center gap-3">
                                <Avatar>
                                  <AvatarImage src={user.avatar} />
                                  <AvatarFallback>{user.username[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-bold">{user.username}</div>
                                  <div className="flex gap-2 mt-1 flex-wrap">
                                    <Badge variant="outline">{user.role}</Badge>
                                    {user.faction && <Badge variant="secondary">{user.faction}</Badge>}
                                    {user.is_banned && <Badge variant="destructive">Забанен</Badge>}
                                    {user.is_muted && <Badge variant="secondary">Замучен</Badge>}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex gap-2 flex-wrap">
                              <Select onValueChange={(role) => handleAssignRole(user.id, role as UserRole)}>
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue placeholder="Назначить роль" />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="user">Пользователь</SelectItem>
                                  <SelectItem value="admin_junior">Младший админ</SelectItem>
                                  <SelectItem value="admin">Администратор</SelectItem>
                                  <SelectItem value="admin_senior">Старший админ</SelectItem>
                                </SelectContent>
                              </Select>
                              
                              <Select onValueChange={(faction) => handleAssignFaction(user.id, faction)}>
                                <SelectTrigger className="w-[180px]">
                                  <SelectValue placeholder="Фракция" />
                                </SelectTrigger>
                                <SelectContent>
                                  {factions.map((f) => (
                                    <SelectItem key={f.name} value={f.name}>
                                      {f.name}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>

                              <Button
                                size="sm"
                                variant={user.is_banned ? 'outline' : 'destructive'}
                                onClick={() => handleBanUser(user.id)}
                              >
                                <Icon name="Ban" size={14} className="mr-1" />
                                {user.is_banned ? 'Разбанить' : 'Бан'}
                              </Button>

                              <Button
                                size="sm"
                                variant={user.is_muted ? 'outline' : 'secondary'}
                                onClick={() => handleMuteUser(user.id)}
                              >
                                <Icon name="VolumeX" size={14} className="mr-1" />
                                {user.is_muted ? 'Размутить' : 'Мут'}
                              </Button>

                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleDeleteUser(user.id)}
                              >
                                <Icon name="Trash2" size={14} className="mr-1" />
                                Удалить
                              </Button>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  </Card>

                  <Card className="p-4 bg-accent/5">
                    <h3 className="font-bold mb-4">Настройки админ-кода</h3>
                    <div className="flex gap-2">
                      <Input
                        value={adminCode}
                        onChange={(e) => setAdminCode(e.target.value)}
                        placeholder="Новый админ-код"
                      />
                      <Button onClick={() => toast.success('Админ-код обновлен!')}>
                        Обновить
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Текущий код: <span className="font-mono">{adminCode}</span>
                    </p>
                  </Card>
                </div>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </main>
    </div>
  );
};

export default Index;