const SUPABASE_URL = 'https://jfjbgzuahxgxuzhpbvjy.supabase.co';
const SUPABASE_KEY =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpmamJnenVhaHhneHV6aHBidmp5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE2NTk3MjEyNDQsImV4cCI6MTk3NTI5NzI0NH0.ALTank2v_SVyJvJfAF_p6loMLpa5JT8KDW0EllJpk5Q';

const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

export async function getGameById(id) {
	const response = await client
		.from('games_test')
		.select('*')
		.match({ id })
		.single();
	return response.data;
}

export async function saveGame(id, state) {
	const response = await client
		.from('games_test')
		.update({
			game_state: state,
		})
		.match({ id: id })
		.single();
	return response.data;
}

export function onSave(gameId, handleNewSave) {
	client
		.from(`games_test:id=eq.${gameId}`)
		.on('UPDATE', handleNewSave)
		.subscribe();
}
