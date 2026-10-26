from pathlib import Path

while True:
    try:
        count = int(input("Сколько файлов создать? "))

        if count < 1:
            print("Введите положительное число.")
            continue

        break

    except ValueError:
        print("Введите целое число.")

for n in range(1, count + 1):
    filename = Path(f"ch-{n:02d}.md")
    filename.touch(exist_ok=True)
    print(f"Создан: {filename}")

print(f"\nГотово. Создано файлов: {count}")