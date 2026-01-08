import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    """Создает подключение к базе данных"""
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    """API для работы с пользователями и постами Russian Town"""
    method = event.get('httpMethod', 'GET')
    path = event.get('queryStringParameters', {}).get('action', '')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=RealDictCursor)
        
        # GET: получение данных
        if method == 'GET':
            if path == 'users':
                cur.execute('SELECT id, username, role, faction, custom_role, status, avatar, is_banned, is_muted, created_at FROM users ORDER BY created_at DESC')
                users = cur.fetchall()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps([dict(u) for u in users], default=str)
                }
            
            elif path == 'posts':
                cur.execute('''
                    SELECT p.id, p.title, p.content, p.created_at,
                           u.username as author, u.avatar as author_avatar
                    FROM posts p
                    JOIN users u ON p.user_id = u.id
                    ORDER BY p.created_at DESC
                ''')
                posts = cur.fetchall()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps([dict(p) for p in posts], default=str)
                }
        
        # POST: создание/аутентификация
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            
            if path == 'register':
                username = body.get('username')
                password = body.get('password')
                admin_code = body.get('adminCode', '')
                
                role = 'admin' if admin_code == '99797' else 'user'
                
                cur.execute(
                    'INSERT INTO users (username, password, role) VALUES (%s, %s, %s) RETURNING id, username, role, avatar',
                    (username, password, role)
                )
                user = cur.fetchone()
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(dict(user), default=str)
                }
            
            elif path == 'login':
                username = body.get('username')
                password = body.get('password')
                
                cur.execute(
                    'SELECT id, username, role, faction, custom_role, status, avatar, is_banned, is_muted FROM users WHERE username = %s AND password = %s',
                    (username, password)
                )
                user = cur.fetchone()
                
                if not user:
                    return {
                        'statusCode': 401,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Неверные данные'})
                    }
                
                if user['is_banned']:
                    return {
                        'statusCode': 403,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Аккаунт заблокирован'})
                    }
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps(dict(user), default=str)
                }
            
            elif path == 'create-post':
                user_id = body.get('userId')
                title = body.get('title')
                content = body.get('content')
                
                cur.execute(
                    'INSERT INTO posts (user_id, title, content) VALUES (%s, %s, %s) RETURNING id',
                    (user_id, title, content)
                )
                post_id = cur.fetchone()['id']
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'id': post_id, 'success': True})
                }
        
        # PUT: обновление
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            user_id = body.get('userId')
            
            if path == 'update-role':
                role = body.get('role')
                cur.execute('UPDATE users SET role = %s WHERE id = %s', (role, user_id))
                conn.commit()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True})
                }
            
            elif path == 'update-faction':
                faction = body.get('faction')
                cur.execute('UPDATE users SET faction = %s WHERE id = %s', (faction, user_id))
                conn.commit()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True})
                }
            
            elif path == 'ban':
                is_banned = body.get('isBanned')
                cur.execute('UPDATE users SET is_banned = %s WHERE id = %s', (is_banned, user_id))
                conn.commit()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True})
                }
            
            elif path == 'mute':
                is_muted = body.get('isMuted')
                cur.execute('UPDATE users SET is_muted = %s WHERE id = %s', (is_muted, user_id))
                conn.commit()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True})
                }
            
            elif path == 'update-avatar':
                avatar = body.get('avatar')
                cur.execute('UPDATE users SET avatar = %s WHERE id = %s', (avatar, user_id))
                conn.commit()
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True})
                }
        
        # DELETE: удаление пользователя
        elif method == 'DELETE':
            user_id = event.get('queryStringParameters', {}).get('userId')
            cur.execute('UPDATE users SET is_banned = TRUE WHERE id = %s', (user_id,))
            conn.commit()
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'success': True})
            }
        
        cur.close()
        conn.close()
        
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Unknown action'})
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': str(e)})
        }
