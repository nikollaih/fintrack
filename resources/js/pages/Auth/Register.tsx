import { useForm, Link } from '@inertiajs/react';
import GuestLayout from '@/layouts/GuestLayout';
import Input from '@/components/UI/Input';
import Button from '@/components/UI/Button';

export default function Register() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/register');
    };

    return (
        <GuestLayout>
            <h2 className="text-xl font-bold text-gray-900 mb-6">Crea tu cuenta</h2>
            <form onSubmit={submit} className="space-y-4">
                <Input
                    label="Nombre completo"
                    type="text"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                    error={errors.name}
                    autoFocus
                    required
                />
                <Input
                    label="Correo electrónico"
                    type="email"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                    error={errors.email}
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
                <Input
                    label="Confirmar contraseña"
                    type="password"
                    value={data.password_confirmation}
                    onChange={(e) => setData('password_confirmation', e.target.value)}
                    error={errors.password_confirmation}
                    required
                />
                <Button type="submit" loading={processing} className="w-full justify-center">
                    Crear cuenta
                </Button>
            </form>
            <p className="mt-6 text-center text-sm text-gray-500">
                ¿Ya tienes cuenta?{' '}
                <Link href="/login" className="text-primary-600 font-medium hover:underline">
                    Inicia sesión
                </Link>
            </p>
        </GuestLayout>
    );
}
