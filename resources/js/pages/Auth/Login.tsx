import { useForm, Link } from '@inertiajs/react';
import GuestLayout from '@/layouts/GuestLayout';
import Input from '@/components/UI/Input';
import Button from '@/components/UI/Button';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <GuestLayout>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Inicia sesión</h2>
            <form onSubmit={submit} className="space-y-4">
                <Input
                    label="Correo electrónico"
                    type="email"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    error={errors.email}
                    autoFocus
                    required
                />
                <Input
                    label="Contraseña"
                    type="password"
                    value={data.password}
                    onChange={(e) => setData('password', e.target.value)}
                    error={errors.password}
                    required
                />
                <div className="flex items-center justify-between">
                    <label className="flex items-center gap-2 text-sm text-gray-600">
                        <input
                            type="checkbox"
                            checked={data.remember}
                            onChange={(e) => setData('remember', e.target.checked)}
                            className="rounded border-gray-300"
                        />
                        Recordarme
                    </label>
                    <Link href="/forgot-password" className="text-sm text-primary-600 hover:underline">
                        ¿Olvidaste tu contraseña?
                    </Link>
                </div>
                <Button type="submit" loading={processing} className="w-full justify-center">
                    Ingresar
                </Button>
            </form>
            <p className="mt-6 text-center text-sm text-gray-500">
                ¿No tienes cuenta?{' '}
                <Link href="/register" className="text-primary-600 font-medium hover:underline">
                    Regístrate
                </Link>
            </p>
        </GuestLayout>
    );
}
